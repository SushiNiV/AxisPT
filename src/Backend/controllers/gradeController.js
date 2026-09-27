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
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one grade entry is required.' });
    }

    const facultyId = req.user?.faculty_id || req.user?.id || null;
    await GradeManageModel.saveGrades(id, facultyId, grades);

    res.status(200).json({ success: true, message: 'Student grades updated successfully.' });
  } catch (error) {
    console.error('Error updating student grades:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
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