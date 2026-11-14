'use strict';

/**
 * Program controller: HTTP layer for managing academic programs.
 *
 * Conventions (shared with the rest of the cleaned backend):
 *  - Success: { success: true, data } or { success: true, message }.
 *  - Failures are thrown as HttpError; Express 5 forwards rejected promises to
 *    the global error handler, so there is no try/catch here.
 *  - Writes that check-then-write run inside withTransaction.
 *  - Audit entries are written after the transaction commits.
 *
 * Programs are archived (program_status = false), never deleted.
 */

const ProgramModel = require('../models/programModel');
const HttpError = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { withTransaction } = require('../../utils/transaction');
const { audit } = require('../../utils/audit');

const VIEW_MODES = ['active', 'archived', 'all'];
const MAX_TOTAL_YEARS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The fields worth recording in the history log. */
const snapshot = (program) => ({
  program_name: program.program_name,
  program_abbr: program.program_abbr,
  total_year: program.total_year,
  program_description: program.program_description,
  program_status: program.program_status,
});

/** Accepts true/false and the strings 'true'/'false'; anything else is rejected. */
function parseStatus(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new HttpError(400, 'Program status must be true or false.');
}

/**
 * Validate and normalise a request body.
 * @param {object} body
 * @param {{ requireAll: boolean }} options  true for create, false for partial update
 * @returns {object} only the fields that were supplied (all required ones on create)
 */
function parseProgramInput(body, { requireAll }) {
  const input = {};

  if (requireAll || body.program_name !== undefined) {
    const name = String(body.program_name ?? '').trim();
    if (!name) throw new HttpError(400, 'Program name is required.');
    input.program_name = name;
  }

  if (requireAll || body.program_abbr !== undefined) {
    const abbr = String(body.program_abbr ?? '').trim();
    if (!abbr) throw new HttpError(400, 'Program abbreviation is required.');
    input.program_abbr = abbr;
  }

  if (requireAll || body.total_year !== undefined) {
    const years = Number(body.total_year);
    if (!Number.isInteger(years) || years < 1 || years > MAX_TOTAL_YEARS) {
      throw new HttpError(400, `Total years must be a whole number from 1 to ${MAX_TOTAL_YEARS}.`);
    }
    input.total_year = years;
  }

  if (body.program_description !== undefined) {
    input.program_description = String(body.program_description ?? '').trim() || null;
  }

  if (body.program_status !== undefined) {
    input.program_status = parseStatus(body.program_status);
  }

  return input;
}

/** Throw 400 if another program already uses this abbreviation (case-insensitive). */
async function assertAbbreviationFree(abbr, client, excludeId = null) {
  const clash = await ProgramModel.findByAbbreviation(abbr, { excludeId }, client);
  if (clash) throw new HttpError(400, 'Program abbreviation already exists.');
}

/** Shared flow for archive and restore. Idempotent: repeating it changes nothing. */
async function changeStatus(req, res, { active, action, message }) {
  const programId = parseId(req.params.program_id);

  const before = await ProgramModel.findById(programId);
  if (!before) throw new HttpError(404, 'Program not found.');

  if (before.program_status !== active) {
    await ProgramModel.setStatus(programId, active);
    await audit(req, {
      tableName: 'programs',
      recordId: programId,
      action,
      oldValues: { program_status: before.program_status },
      newValues: { program_status: active },
    });
  }

  res.json({ success: true, message });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /programs?mode=active|archived|all  (non-admins always get active only) */
exports.getPrograms = async (req, res) => {
  const { mode, includeArchived } = req.query;

  let resolvedMode = VIEW_MODES.includes(mode)
    ? mode
    : includeArchived === 'true' ? 'all' : 'active';

  if (req.user?.role !== 'admin') resolvedMode = 'active';

  const programs = await ProgramModel.getAll({ mode: resolvedMode });
  res.json({ success: true, data: programs });
};

/** POST /programs */
exports.addProgram = async (req, res) => {
  const input = parseProgramInput(req.body ?? {}, { requireAll: true });

  let program;
  await withTransaction(async (client) => {
    await ProgramModel.lockAbbreviations(client);
    await assertAbbreviationFree(input.program_abbr, client);
    program = await ProgramModel.create(input, client);
  });

  await audit(req, {
    tableName: 'programs',
    recordId: program.program_id,
    action: 'PROGRAM_CREATED',
    oldValues: null,
    newValues: snapshot(program),
  });

  res.status(201).json({ success: true, message: 'Program created successfully.', data: program });
};

/** PUT /programs/:program_id  (omitted fields are left unchanged) */
exports.updateProgram = async (req, res) => {
  const programId = parseId(req.params.program_id);
  const changes = parseProgramInput(req.body ?? {}, { requireAll: false });

  let before;
  let after;
  await withTransaction(async (client) => {
    before = await ProgramModel.findById(programId, client);
    if (!before) throw new HttpError(404, 'Program not found.');

    if (changes.program_abbr !== undefined) {
      await ProgramModel.lockAbbreviations(client);
      await assertAbbreviationFree(changes.program_abbr, client, programId);
    }

    after = await ProgramModel.update(programId, changes, client);
  });

  await audit(req, {
    tableName: 'programs',
    recordId: programId,
    action: 'PROGRAM_UPDATED',
    oldValues: snapshot(before),
    newValues: snapshot(after),
  });

  res.json({ success: true, message: 'Program updated successfully.', data: after });
};

/** DELETE /programs/:program_id  (archives; programs are referenced by other tables) */
exports.deleteProgram = (req, res) =>
  changeStatus(req, res, {
    active: false,
    action: 'PROGRAM_ARCHIVED',
    message: 'Program archived successfully.',
  });

/** POST /programs/:program_id/restore */
exports.restoreProgram = (req, res) =>
  changeStatus(req, res, {
    active: true,
    action: 'PROGRAM_RESTORED',
    message: 'Program restored successfully.',
  });