const GradeManageModel = require('../models/grademanageModel');

// ==========================================
// GRADE MANAGEMENT
// ==========================================

exports.getGradableCourses = async (req, res) => {
  try {
    const courses = await GradeManageModel.getGradableCourses();
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching gradable courses:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const gradeSheet = await GradeManageModel.getGradeSheet(id);

    if (!gradeSheet) {
      return res.status(404).json({
        success: false,
        message: 'No curriculum/enrollment record found for this student, so a grade sheet could not be built.'
      });
    }

    res.status(200).json({ success: true, data: gradeSheet });
  } catch (error) {
    console.error('Error fetching student grade sheet:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.updateStudentGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester_id: semesterId, grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one grade entry is required.' });
    }
    if (!semesterId) {
      return res.status(400).json({ success: false, message: 'semester_id is required.' });
    }

    // Enforce that every entry belongs to the requested semester.
    const mismatched = grades.find((g) => Number(g.semesterId) !== Number(semesterId));
    if (mismatched) {
      return res.status(400).json({
        success: false,
        message: 'All grade entries must belong to the supplied semester_id.',
      });
    }

    const facultyId = req.user?.faculty_id || req.user?.id || null;
    await GradeManageModel.saveGrades(id, facultyId, grades);

    res.status(200).json({ success: true, message: 'Student grades updated successfully.' });
  } catch (error) {
    console.error('Error updating student grades:', error);

    // Postgres check-constraint violation (e.g. a raw/transmuted value out of range).
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'A grade value is outside the allowed range (Raw and Transmuted must be 60-100).',
      });
    }

    const isValidationError = /required|Cannot save grades|Unable to determine|No grade entries|must be between/i.test(error.message);
    res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: isValidationError ? error.message : 'Internal server error.',
    });
  }
};

exports.getGradableCoursesForStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const courses = await GradeManageModel.getGradableCourses();

    const eligibility = await GradeManageModel.checkPrerequisiteEligibility(
      id, courses.map((c) => c.courseId)
    );

    const curriculumYearMap = await GradeManageModel.getCurriculumYearLevelMap(id);
    const passedMap = await GradeManageModel.getCoursePassedMap(id);

    const enriched = courses
      .filter((c) => curriculumYearMap.has(c.courseId))
      .map((c) => {
        const e = eligibility.get(c.courseId) || { eligible: true, missing: [], missingIds: [] };
        return {
          ...c,
          curriculumYearLevel: curriculumYearMap.get(c.courseId),
          alreadyPassed: passedMap.get(c.courseId) === true,
          prereqEligible: e.eligible,
          prereqMissing: e.missing,
          prereqMissingIds: e.missingIds
        };
      });

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching gradable courses for student:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.deleteEmptyStudentGrade = async (req, res) => {
  try {
    const { id, courseId } = req.params;
    const { yearLevel, semesterId } = req.query;

    if (!yearLevel || !semesterId) {
      return res.status(400).json({ success: false, message: 'yearLevel and semesterId are required.' });
    }

    // This will return false if there was no row to begin with
    const deleted = await GradeManageModel.deleteEmptyAssignment(Number(id), Number(courseId), Number(yearLevel), Number(semesterId));
    
    // We return success: true regardless, because the end state is "it's gone" which is what the user wanted
    res.status(200).json({ success: true, message: deleted ? 'Course deleted.' : 'Course already empty.' });
  } catch (error) {
    console.error('Error deleting empty course:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.archiveStudentGrade = async (req, res) => {
  try {
    const { gradeId } = req.query;
    const { reason } = req.body || {};

    if (!gradeId) {
      return res.status(400).json({ success: false, message: 'gradeId is required.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required to archive a grade.' });
    }

    const facultyId = req.user?.faculty_id || req.user?.id || null;

    await GradeManageModel.archiveGradeById(Number(gradeId), { reason: reason.trim(), facultyId });

    res.status(200).json({ success: true, message: 'Grade archived successfully.' });
  } catch (error) {
    console.error('Error archiving grade:', error);
    const expected = ['Grade not found or already archived.', 'A reason is required to archive a grade.'];
    const isExpected = expected.includes(error.message);
    res.status(isExpected ? 400 : 500).json({
      success: false,
      message: isExpected ? error.message : 'Internal server error.'
    });
  }
};

exports.getArchivedStudentGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const archived = await GradeManageModel.getArchivedGradesForStudent(id);
    res.status(200).json({ success: true, data: archived });
  } catch (error) {
    console.error('Error fetching archived grades:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.restoreStudentGrade = async (req, res) => {
  try {
    const { gradeId } = req.query;

    if (!gradeId) {
      return res.status(400).json({ success: false, message: 'gradeId is required.' });
    }

    const facultyId = req.user?.faculty_id || req.user?.id || null;

    await GradeManageModel.restoreGradeById(Number(gradeId), { facultyId });

    res.status(200).json({ success: true, message: 'Grade restored successfully.' });
  } catch (error) {
    console.error('Error restoring grade:', error);
    const expected = ['Grade not found or is not archived.'];
    const isExpected = expected.includes(error.message);
    res.status(isExpected ? 400 : 500).json({
      success: false,
      message: isExpected ? error.message : 'Internal server error.'
    });
  }
};