'use strict';

/**
 * Grade controller: HTTP layer for student grades.
 *
 * Conventions (shared with the rest of the cleaned backend):
 *  - Success: { success: true, data } or { success: true, message }.
 *  - Failures are thrown as HttpError; Express 5 forwards rejected promises to
 *    the global error handler, so handlers have no try/catch.
 *  - The model owns transactions; audit entries are written here, after commit.
 *
 * Grades are archived (archived_at set), never deleted, except for empty
 * assignments that have no scores.
 */

const GradeManageModel = require('../models/grademanageModel');
const { HttpError } = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { audit } = require('../../utils/audit');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turn known Postgres constraint errors into client errors; rethrow anything else. */
function translateDbError(error) {
  if (error?.code === '23514') {
    throw new HttpError(400, 'A grade value is outside the allowed range (Raw and Transmuted must be 60-100).');
  }
  if (error?.code === '23503') {
    throw new HttpError(400, 'The selected student, course, academic year, or semester does not exist.');
  }
  throw error;
}

/**
 * faculties.faculty_id of the signed-in user, or null (admins have no faculty
 * record). grades.faculty_id references faculty_id, so a user id must not be
 * used in its place.
 */
async function resolveFacultyId(req) {
  if (req.user?.faculty_id) return req.user.faculty_id;
  if (!req.user?.id) return null;
  return GradeManageModel.findFacultyIdByUserId(req.user.id);
}

// ---------------------------------------------------------------------------
// Handlers: reading
// ---------------------------------------------------------------------------

/** GET /courses/gradable */
exports.getGradableCourses = async (req, res) => {
  const courses = await GradeManageModel.getGradableCourses();
  res.status(200).json({ success: true, data: courses });
};

/** GET /students/:id/grades */
exports.getStudentGrades = async (req, res) => {
  const studentId = parseId(req.params.id);

  const gradeSheet = await GradeManageModel.getGradeSheet(studentId);
  if (!gradeSheet) {
    throw new HttpError(
      404,
      'No curriculum/enrollment record found for this student, so a grade sheet could not be built.'
    );
  }

  res.status(200).json({ success: true, data: gradeSheet });
};

/** GET /students/:id/gradable-courses  Curriculum courses with prerequisite and pass status. */
exports.getGradableCoursesForStudent = async (req, res) => {
  const studentId = parseId(req.params.id);

  const [courses, curriculumYearMap, passedMap] = await Promise.all([
    GradeManageModel.getGradableCourses(),
    GradeManageModel.getCurriculumYearLevelMap(studentId),
    GradeManageModel.getCoursePassedMap(studentId),
  ]);

  const inCurriculum = courses.filter((c) => curriculumYearMap.has(c.courseId));
  const eligibility = await GradeManageModel.checkPrerequisiteEligibility(
    studentId,
    inCurriculum.map((c) => c.courseId)
  );

  const data = inCurriculum.map((course) => {
    const e = eligibility.get(course.courseId) || { eligible: true, missing: [], missingIds: [] };
    return {
      ...course,
      curriculumYearLevel: curriculumYearMap.get(course.courseId),
      alreadyPassed: passedMap.get(course.courseId) === true,
      prereqEligible: e.eligible,
      prereqMissing: e.missing,
      prereqMissingIds: e.missingIds,
    };
  });

  res.status(200).json({ success: true, data });
};

/** GET /students/:id/grades/archived */
exports.getArchivedStudentGrades = async (req, res) => {
  const studentId = parseId(req.params.id);
  const archived = await GradeManageModel.getArchivedGradesForStudent(studentId);
  res.status(200).json({ success: true, data: archived });
};

// ---------------------------------------------------------------------------
// Handlers: writing
// ---------------------------------------------------------------------------

/** PUT /students/:id/grades  Body: { semester_id, grades: [...] }. All entries save, or none. */
exports.updateStudentGrades = async (req, res) => {
  const studentId = parseId(req.params.id);
  const { semester_id: semesterId, grades } = req.body ?? {};

  if (!Array.isArray(grades) || grades.length === 0) {
    throw new HttpError(400, 'At least one grade entry is required.');
  }
  if (!semesterId) {
    throw new HttpError(400, 'semester_id is required.');
  }
  if (grades.some((g) => Number(g?.semesterId) !== Number(semesterId))) {
    throw new HttpError(400, 'All grade entries must belong to the supplied semester_id.');
  }

  const facultyId = await resolveFacultyId(req);
  const saved = await GradeManageModel.saveGrades(studentId, facultyId, grades).catch(translateDbError);

  // Waiving a prerequisite is an exception worth a permanent record.
  for (const entry of saved.filter((s) => s.missingPrereqIds.length > 0)) {
    await audit(req, {
      tableName: 'grades',
      recordId: entry.gradeId,
      action: 'PREREQ_OVERRIDE',
      oldValues: null,
      newValues: {
        student_id: studentId,
        course_id: entry.courseId,
        course_code: entry.courseCode,
        year_level: entry.yearLevel,
        semester_id: entry.semesterId,
        missing_prereq_ids: entry.missingPrereqIds,
        missing_prereqs: entry.missingPrereqCodes,
      },
    });
  }

  res.status(200).json({ success: true, message: 'Student grades updated successfully.' });
};

/**
 * DELETE /students/:id/grades/:courseId/empty?yearLevel=&semesterId=
 * Removes an assignment that has no scores. Succeeds even if it was already gone.
 */
exports.deleteEmptyStudentGrade = async (req, res) => {
  const studentId = parseId(req.params.id);
  const courseId = parseId(req.params.courseId);
  const { yearLevel, semesterId } = req.query;

  if (!yearLevel || !semesterId) {
    throw new HttpError(400, 'yearLevel and semesterId are required.');
  }

  const deleted = await GradeManageModel.deleteEmptyAssignment(
    studentId, courseId, parseId(yearLevel), parseId(semesterId)
  );

  res.status(200).json({ success: true, message: deleted ? 'Course deleted.' : 'Course already empty.' });
};

/** POST /students/:id/grades/:courseId/archive?gradeId=  Body: { reason } */
exports.archiveStudentGrade = async (req, res) => {
  const studentId = parseId(req.params.id);
  const { gradeId } = req.query;
  const reason = String(req.body?.reason ?? '').trim();

  if (!gradeId) throw new HttpError(400, 'gradeId is required.');
  if (!reason) throw new HttpError(400, 'A reason is required to archive a grade.');

  const archived = await GradeManageModel.archiveGradeById(parseId(gradeId), { reason, studentId });
  if (!archived) throw new HttpError(400, 'Grade not found or already archived.');

  await audit(req, {
    tableName: 'grades',
    recordId: archived.grade_id,
    action: 'GRADE_ARCHIVED',
    oldValues: null,
    newValues: {
      student_id: archived.student_id,
      course_id: archived.course_id,
      course_code: archived.course_code,
      year_level: archived.year_level,
      semester_id: archived.semester_id,
      reason,
    },
  });

  res.status(200).json({ success: true, message: 'Grade archived successfully.' });
};

/** POST /students/:id/grades/:courseId/restore?gradeId= */
exports.restoreStudentGrade = async (req, res) => {
  const studentId = parseId(req.params.id);
  const { gradeId } = req.query;

  if (!gradeId) throw new HttpError(400, 'gradeId is required.');

  const restored = await GradeManageModel.restoreGradeById(parseId(gradeId), { studentId });
  if (!restored) throw new HttpError(400, 'Grade not found or is not archived.');

  await audit(req, {
    tableName: 'grades',
    recordId: restored.grade_id,
    action: 'GRADE_RESTORED',
    oldValues: null,
    newValues: {
      student_id: restored.student_id,
      course_id: restored.course_id,
      course_code: restored.course_code,
      year_level: restored.year_level,
      semester_id: restored.semester_id,
    },
  });

  res.status(200).json({ success: true, message: 'Grade restored successfully.' });
};