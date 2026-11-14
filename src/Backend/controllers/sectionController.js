'use strict';

/**
 * Section controller: HTTP layer for sections and section assignments.
 *
 * Conventions (shared with the rest of the cleaned backend):
 *  - Success: { success: true, data } or { success: true, message }.
 *  - Failures are thrown as HttpError; Express 5 forwards rejected promises to
 *    the global error handler, so handlers have no try/catch.
 *  - Writes run in withTransaction; audit entries are written after commit.
 *  - Database constraint violations are translated into 400 responses, so the
 *    unique index on (section_id, year_id, semester_id) is the single arbiter
 *    of duplicate assignments (no racy check-then-insert).
 *
 * Assignments are archived (is_active = false), never deleted.
 */

const SectionModel = require('../models/sectionModel');
const HttpError = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { withTransaction } = require('../../utils/transaction');
const { audit } = require('../../utils/audit');

/** Values of the `year_level` enum in the database. */
const YEAR_LEVELS = ['1', '2', '3', '4', '5'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The assignment fields worth recording in the history log. */
const snapshot = (assignment) => ({
  section_id: assignment.section_id,
  year_id: assignment.year_id,
  semester_id: assignment.semester_id,
  year_level: assignment.year_level,
  adviser_id: assignment.adviser_id,
  is_active: assignment.is_active,
});

/** Turn known Postgres constraint errors into client errors; rethrow anything else. */
function translateDbError(error) {
  if (error?.code === '23505') {
    throw new HttpError(400, 'This section is already assigned for the selected academic year and semester.');
  }
  if (error?.code === '23503') {
    throw new HttpError(400, 'The selected section, academic year, semester, or adviser does not exist.');
  }
  throw error;
}

function parseYearLevel(value) {
  const level = String(value ?? '').trim();
  if (!YEAR_LEVELS.includes(level)) {
    throw new HttpError(400, `Year level must be one of: ${YEAR_LEVELS.join(', ')}.`);
  }
  return level;
}

/** An adviser is optional: null, undefined and '' all mean "no adviser". */
const parseAdviserId = (value) => (value == null || value === '' ? null : parseId(value));

function parseActive(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new HttpError(400, 'is_active must be true or false.');
}

/** Admins may see archived sections; everyone else only gets active ones. */
const canSeeArchived = (req) => req.user?.role === 'admin';

/**
 * Resolve which section a create request refers to, and the term it applies to.
 *
 *  - section_option "new":      create the section (or reuse one with the same name).
 *  - section_option "existing": reuse section_id and carry over the year level and
 *                               semester of its latest assignment, if it has one.
 *  - anything else:             use section_id and the term fields as sent.
 *
 * @returns {Promise<{ sectionId: number, yearId: *, semesterId: *, yearLevel: * }>}
 */
async function resolveSectionAndTerm(body, client) {
  let { year_id: yearId, semester_id: semesterId, year_level: yearLevel } = body;
  let sectionId;

  if (body.section_option === 'new') {
    const name = String(body.section_name ?? '').trim();
    if (!name) throw new HttpError(400, 'Section name is required.');
    sectionId = await SectionModel.createOrGetSection(name, parseId(body.program_id), client);
  } else {
    sectionId = parseId(body.section_id);

    if (body.section_option === 'existing') {
      const latest = await SectionModel.getLatestAssignmentBySectionId(sectionId, client);
      if (latest) {
        yearLevel = latest.year_level;
        semesterId = latest.semester_id;
        yearId = yearId || latest.year_id;
      }
    }
  }

  return { sectionId, yearId, semesterId, yearLevel };
}

/** Shared flow for archive and restore. Idempotent: repeating it changes nothing. */
async function changeActive(req, res, { active, action, message }) {
  const assignmentId = parseId(req.params.assignment_id);

  const before = await SectionModel.getById(assignmentId);
  if (!before) throw new HttpError(404, 'Section assignment not found.');

  if (before.is_active !== active) {
    await SectionModel.setAssignmentActive(assignmentId, active);
    await audit(req, {
      tableName: 'section_assignments',
      recordId: assignmentId,
      action,
      oldValues: { is_active: before.is_active },
      newValues: { is_active: active },
    });
  }

  res.json({ success: true, message });
}

// ---------------------------------------------------------------------------
// Handlers: reading
// ---------------------------------------------------------------------------

/**
 * GET /sections, /sections/active, /sections/all?program_id=  Active sections of a program in the current term.
 * Serves the three route names the frontend already uses.
 */
const listActiveByProgram = async (req, res) => {
  const programId = parseId(req.query.program_id);
  const sections = await SectionModel.getByProgramAndTerm(programId);
  res.json({ success: true, data: sections });
};

exports.getActiveSectionsByProgram = listActiveByProgram;
exports.getAllSectionsByProgram = listActiveByProgram;
exports.getSectionsByProgram = listActiveByProgram;

/** GET /sections/by-program/:programId?yearId=&semesterId=&yearLevel=&includeArchived= */
exports.getSectionsByProgramId = async (req, res) => {
  const programId = parseId(req.params.programId);
  const { yearId, semesterId, yearLevel, includeArchived } = req.query;

  const sections = await SectionModel.getByProgramAndTerm(
    programId,
    yearId ? parseId(yearId) : null,
    semesterId ? parseId(semesterId) : null,
    yearLevel ? String(yearLevel) : null,
    includeArchived === 'true' && canSeeArchived(req)
  );

  res.json({ success: true, data: sections });
};

/** GET /sections/archived  Every archived assignment across programs. */
exports.getArchivedSections = async (req, res) => {
  const sections = await SectionModel.getAllArchived();
  res.json({ success: true, data: sections });
};

// ---------------------------------------------------------------------------
// Handlers: writing
// ---------------------------------------------------------------------------

/** POST /section-assignments  Create an assignment, creating the section first when section_option is "new". */
exports.addSectionAssignment = async (req, res) => {
  const body = req.body ?? {};
  let assignment;

  await withTransaction(async (client) => {
    const { sectionId, yearId, semesterId, yearLevel } = await resolveSectionAndTerm(body, client);

    if (!yearId || !semesterId || !yearLevel) {
      throw new HttpError(400, 'Academic year, semester, and year level are required.');
    }

    assignment = await SectionModel.createAssignment(
      {
        section_id: sectionId,
        year_id: parseId(yearId),
        semester_id: parseId(semesterId),
        year_level: parseYearLevel(yearLevel),
        adviser_id: parseAdviserId(body.adviser_id),
        is_active: body.is_active === undefined ? undefined : parseActive(body.is_active),
      },
      client
    );
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'section_assignments',
    recordId: assignment.assignment_id,
    action: 'SECTION_ASSIGNMENT_CREATED',
    oldValues: null,
    newValues: snapshot(assignment),
  });

  res.status(201).json({
    success: true,
    message: 'Section assignment added successfully!',
    data: assignment,
  });
};

/** PUT /section-assignments/:assignment_id  Omitted fields are left unchanged; adviser_id: null clears the adviser. */
exports.updateSectionAssignment = async (req, res) => {
  const assignmentId = parseId(req.params.assignment_id);
  const body = req.body ?? {};

  const changes = {};
  if (body.year_id !== undefined) changes.year_id = parseId(body.year_id);
  if (body.semester_id !== undefined) changes.semester_id = parseId(body.semester_id);
  if (body.year_level !== undefined) changes.year_level = parseYearLevel(body.year_level);
  if (body.adviser_id !== undefined) changes.adviser_id = parseAdviserId(body.adviser_id);
  if (body.is_active !== undefined) changes.is_active = parseActive(body.is_active);

  let before;
  let after;
  await withTransaction(async (client) => {
    before = await SectionModel.getById(assignmentId, client);
    if (!before) throw new HttpError(404, 'Section assignment not found.');
    after = await SectionModel.updateAssignment(assignmentId, changes, client);
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'section_assignments',
    recordId: assignmentId,
    action: 'SECTION_ASSIGNMENT_UPDATED',
    oldValues: snapshot(before),
    newValues: snapshot(after),
  });

  res.json({ success: true, message: 'Section assignment updated successfully.', data: after });
};

/** DELETE /section-assignments/:assignment_id  Archives the assignment. */
exports.deleteSectionAssignment = (req, res) =>
  changeActive(req, res, {
    active: false,
    action: 'SECTION_ARCHIVED',
    message: 'Section archived successfully.',
  });

/** POST /section-assignments/:assignment_id/restore */
exports.restoreSectionAssignment = (req, res) =>
  changeActive(req, res, {
    active: true,
    action: 'SECTION_RESTORED',
    message: 'Section restored successfully.',
  });