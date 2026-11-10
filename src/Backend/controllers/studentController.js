'use strict';

/**
 * Student controller: HTTP layer for managing student records (staff-facing).
 *
 * Conventions (shared with the rest of the cleaned backend):
 *  - Success: { success: true, data } or { success: true, message }.
 *  - Failures are thrown as HttpError; Express 5 forwards rejected promises to
 *    the global error handler, so handlers have no try/catch (the bulk archive
 *    is the one exception: it reports per-student failures).
 *  - The model owns transactions; audit entries are written here, after commit.
 *  - Students are archived, never deleted.
 */

const StudentManageModel = require('../models/studentmanageModel');
const GradeManageModel = require('../models/grademanageModel');
const { HttpError } = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { audit } = require('../../utils/audit');

const PROBATION_OPTIONS = ['Automatic', 'None', 'Warning', 'Probationary 1', 'Probationary 2'];
const STANDING_OPTIONS = ['Regular', 'Irregular'];
const YEAR_LEVELS = ['1', '2', '3', '4', '5'];

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1000;
const MAX_BATCH_SIZE = 500;
const MAX_REASON_LENGTH = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turn known Postgres errors into client errors; rethrow anything else. */
function translateDbError(error) {
  switch (error?.code) {
    case '23505':
      throw new HttpError(400, 'Student number or email already exists.');
    case '23503':
      throw new HttpError(400, 'A selected program, curriculum, section, or academic term does not exist.');
    case '22P02':
    case '22003':
      throw new HttpError(400, 'One of the submitted values is not valid.');
    default:
      throw error;
  }
}

/** Admins may see archived students; everyone else only gets active ones. */
const canSeeArchived = (req) => req.user?.role === 'admin';

function parseIntInRange(value, { name, min, max, fallback }) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${name} must be a whole number from ${min} to ${max}.`);
  }
  return n;
}

/** A non-empty array of student ids, no larger than MAX_BATCH_SIZE, without duplicates. */
function parseStudentIds(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'studentIds (array) is required.');
  }
  if (value.length > MAX_BATCH_SIZE) {
    throw new HttpError(400, `At most ${MAX_BATCH_SIZE} students can be processed at once.`);
  }
  return [...new Set(value.map((id) => parseId(id)))];
}

function parseReason(value) {
  const reason = typeof value === 'string' ? value.trim().slice(0, MAX_REASON_LENGTH) : '';
  return reason || null;
}

/** Merge the computed academic standing into a student row. */
function withStanding(student, standingMap) {
  const standing = standingMap.get(student.student_id);
  return {
    ...student,
    academic_status: standing?.status || 'None',
    academic_status_overridden: standing?.isOverridden || false,
  };
}

// ---------------------------------------------------------------------------
// Handlers: reading
// ---------------------------------------------------------------------------

/** GET /students?search=&programId=&limit=&offset=&includeArchived= */
exports.getStudentMasterlist = async (req, res) => {
  const { search, programId, limit, offset, includeArchived } = req.query;

  const masterlist = await StudentManageModel.getMasterlist({
    search: typeof search === 'string' ? search.trim() : '',
    programId: programId ? parseId(programId) : null,
    includeArchived: includeArchived === 'true' && canSeeArchived(req),
    limit: parseIntInRange(limit, { name: 'limit', min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE }),
    offset: parseIntInRange(offset, { name: 'offset', min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
  });

  const standingMap = await GradeManageModel.getAcademicStandingMap();
  res.json({ success: true, data: masterlist.map((s) => withStanding(s, standingMap)) });
};

/** GET /students/:id */
exports.getStudentById = async (req, res) => {
  const student = await StudentManageModel.getById(parseId(req.params.id));
  if (!student) throw new HttpError(404, 'Student record not found.');

  const standingMap = await GradeManageModel.getAcademicStandingMap();
  res.status(200).json({ success: true, data: withStanding(student, standingMap) });
};

// ---------------------------------------------------------------------------
// Handlers: writing
// ---------------------------------------------------------------------------

/** POST /students */
exports.createStudent = async (req, res) => {
  const body = req.body ?? {};

  const created = await StudentManageModel.create(body).catch(translateDbError);

  await audit(req, {
    tableName: 'students',
    recordId: created.student_id,
    action: 'STUDENT_CREATED',
    targetUserId: created.user_id,
    oldValues: null,
    newValues: {
      student_id: created.student_id,
      student_number: body.studentNumber || body.student_number,
    },
  });

  res.status(201).json({ success: true, message: 'Student created successfully.', data: created });
};

/** PUT /students/:id  Fields that are not sent are left unchanged. */
exports.updateStudent = async (req, res) => {
  const studentId = parseId(req.params.id);
  const body = req.body ?? {};

  const { userId } = await StudentManageModel.update(studentId, body).catch(translateDbError);

  // Record which fields were submitted, not their values (they include personal data).
  await audit(req, {
    tableName: 'students',
    recordId: studentId,
    action: 'STUDENT_UPDATED',
    targetUserId: userId,
    oldValues: null,
    newValues: { student_id: studentId, fields: Object.keys(body) },
  });

  res.status(200).json({ success: true, message: 'Student record updated successfully.' });
};

/** PUT /students/:id/status  Body: { probation_status?, standing?, reason } */
exports.updateStudentStatus = async (req, res) => {
  const studentId = parseId(req.params.id);
  const { probation_status: probationStatus, standing, reason } = req.body ?? {};

  if (probationStatus === undefined && standing === undefined) {
    throw new HttpError(400, 'Provide probation_status and/or standing.');
  }
  if (probationStatus !== undefined && !PROBATION_OPTIONS.includes(probationStatus)) {
    throw new HttpError(400, 'Invalid probation status.');
  }
  if (standing !== undefined && !STANDING_OPTIONS.includes(standing)) {
    throw new HttpError(400, 'Invalid standing.');
  }

  const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 200) : '';
  if (!cleanReason) {
    throw new HttpError(400, 'A reason is required for manual status changes.');
  }

  // verified_by_id references faculties, so the acting account needs a faculty_id.
  const facultyId = req.user?.faculty_id ?? null;
  if (probationStatus !== undefined && probationStatus !== 'Automatic' && !facultyId) {
    throw new HttpError(
      403,
      "Your account isn't linked to a faculty record, so it can't verify a probation status."
    );
  }

  const { studentUserId, before, after } = await StudentManageModel.updateStatus(studentId, {
    probationStatus,
    standing,
    facultyId,
  });

  await audit(req, {
    tableName: 'students',
    recordId: studentId,
    action: 'STUDENT_STATUS_CHANGED',
    targetUserId: studentUserId,
    oldValues: before,
    newValues: { ...after, student_id: studentId, reason: cleanReason },
  });

  res.json({ success: true, message: 'Student status updated.' });
};

/** DELETE /students/:id  Archives the student (and deactivates their login). */
exports.deleteStudent = async (req, res) => {
  const studentId = parseId(req.params.id);
  const reason = parseReason(req.body?.reason);

  const { userId } = await StudentManageModel.archive(studentId, { reason });

  await audit(req, {
    tableName: 'students',
    recordId: studentId,
    action: 'STUDENT_ARCHIVED',
    targetUserId: userId,
    oldValues: null,
    newValues: { student_id: studentId, reason },
  });

  res.status(200).json({ success: true, message: 'Student archived successfully.' });
};

/** POST /students/:id/restore */
exports.restoreStudent = async (req, res) => {
  const studentId = parseId(req.params.id);

  const { userId } = await StudentManageModel.unarchive(studentId);

  await audit(req, {
    tableName: 'students',
    recordId: studentId,
    action: 'STUDENT_RESTORED',
    targetUserId: userId,
    oldValues: null,
    newValues: { student_id: studentId },
  });

  res.status(200).json({ success: true, message: 'Student restored successfully.' });
};

/** PUT /students/batch-update  Body: { studentIds, yearLevel?, sectionId? } */
exports.updateStudentsBulk = async (req, res) => {
  const body = req.body ?? {};
  const studentIds = parseStudentIds(body.studentIds);

  if (!body.yearLevel && !body.sectionId) {
    throw new HttpError(400, 'Provide at least a yearLevel or sectionId to update.');
  }

  let yearLevel = null;
  if (body.yearLevel) {
    yearLevel = String(body.yearLevel);
    if (!YEAR_LEVELS.includes(yearLevel)) {
      throw new HttpError(400, `Year level must be one of: ${YEAR_LEVELS.join(', ')}.`);
    }
  }

  const updated = await StudentManageModel.bulkUpdateEducation(studentIds, {
    yearLevel,
    sectionId: body.sectionId ? parseId(body.sectionId) : null,
  });

  res.json({ success: true, message: `${updated.length} student(s) updated.`, data: updated });
};

/**
 * DELETE /students/batch-delete  Body: { studentIds, reason? }
 * Archives each student on its own, so one failure does not stop the rest.
 */
exports.deleteStudentsBulk = async (req, res) => {
  const studentIds = parseStudentIds(req.body?.studentIds);
  const reason = parseReason(req.body?.reason);

  let archived = 0;
  const failures = [];

  for (const id of studentIds) {
    try {
      const { userId } = await StudentManageModel.archive(id, { reason });
      archived += 1;
      await audit(req, {
        tableName: 'students',
        recordId: id,
        action: 'STUDENT_ARCHIVED',
        targetUserId: userId,
        oldValues: null,
        newValues: { student_id: id, reason },
      });
    } catch (error) {
      // Expected problems (not found, already archived) are reported as they are;
      // anything else is logged and reported generically.
      if (!(error instanceof HttpError)) console.error(`Failed to archive student ${id}:`, error);
      failures.push({ id, error: error instanceof HttpError ? error.message : 'Unexpected error.' });
    }
  }

  res.json({
    success: true,
    message: `${archived} student(s) archived.`,
    data: { archived, failures },
  });
};