'use strict';

/**
 * Academic controller: academic years (with the current semester) and curricula.
 *
 * Conventions (shared with the rest of the cleaned backend):
 *  - Success: { success: true, data } or { success: true, message }.
 *  - Failures are thrown as HttpError; Express 5 forwards rejected promises to
 *    the global error handler, so handlers have no try/catch.
 *  - Writes that depend on a check run in withTransaction behind an advisory
 *    lock; audit entries are written after commit.
 *  - Updates are partial: fields that are not sent are left unchanged.
 *
 * Academic years and curricula are never deleted: grades, enrolments and
 * sections reference them.
 */

const AcademicYearModel = require('../models/acadyearModel');
const CurriculumModel = require('../models/curriculumModel');
const HttpError = require('../../utils/httpError');
const { parseId } = require('../../utils/request');
const { withTransaction } = require('../../utils/transaction');
const { audit } = require('../../utils/audit');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turn known Postgres constraint errors into client errors; rethrow anything else. */
function translateDbError(error) {
  if (error?.code === '23503') {
    throw new HttpError(400, 'The selected program or semester does not exist.');
  }
  throw error;
}

/** Accepts true/false and the strings 'true'/'false'; anything else is rejected. */
function parseActive(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new HttpError(400, 'is_active must be true or false.');
}

/** A required, trimmed, non-empty string. */
function parseRequiredText(value, message) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpError(400, message);
  return text;
}

/** A semester id; null, '' and 0 mean "no semester". */
const parseSemesterId = (value) => (value == null || value === '' || value === 0 ? null : parseId(value));

function parseStartYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new HttpError(400, 'Start year must be a valid year.');
  }
  return year;
}

/** Fields of an academic year worth recording in the history log. */
const yearSnapshot = (year) => ({
  year_label: year.year_label,
  is_active: year.is_active,
  current_sem: year.current_sem,
});

/** Fields of a curriculum worth recording in the history log. */
const curriculumSnapshot = (curriculum) => ({
  program_id: curriculum.program_id,
  start_year: curriculum.start_year,
  version_name: curriculum.version_name,
  is_active: curriculum.is_active,
});

async function assertYearLabelFree(label, client, excludeId = null) {
  const clash = await AcademicYearModel.findByLabel(label, { excludeId }, client);
  if (clash) throw new HttpError(400, 'Academic year already exists.');
}

async function assertCurriculumFree(key, client, excludeId = null) {
  const clash = await CurriculumModel.findDuplicate(key, { excludeId }, client);
  if (clash) throw new HttpError(400, 'This curriculum already exists for the program.');
}

// ---------------------------------------------------------------------------
// Academic years
// ---------------------------------------------------------------------------

/** GET /academic-years */
exports.getAcademicYears = async (req, res) => {
  const years = await AcademicYearModel.getAll();
  res.json({ success: true, data: years });
};

/** POST /academic-years  Creating an active year deactivates the others. */
exports.addAcademicYear = async (req, res) => {
  const body = req.body ?? {};
  const input = {
    year_label: parseRequiredText(body.year_label, 'Year label is required.'),
    is_active: body.is_active === undefined ? false : parseActive(body.is_active),
    current_sem: parseSemesterId(body.current_sem),
  };

  let year;
  await withTransaction(async (client) => {
    await AcademicYearModel.lockWrites(client);
    await assertYearLabelFree(input.year_label, client);
    year = await AcademicYearModel.create(input, client);
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'academic_year',
    recordId: year.year_id,
    action: 'ACADEMIC_YEAR_CREATED',
    oldValues: null,
    newValues: { year_id: year.year_id, ...yearSnapshot(year) },
  });

  res.json({ success: true, message: 'Academic year created successfully.', data: year });
};

/**
 * PUT /academic-years/:year_id
 * The active year cannot be deactivated here: activate another year instead, so
 * the system is never left without an active year.
 */
exports.updateAcademicYear = async (req, res) => {
  const yearId = parseId(req.params.year_id);
  const body = req.body ?? {};

  const changes = {};
  if (body.year_label !== undefined) {
    changes.year_label = parseRequiredText(body.year_label, 'Year label cannot be empty.');
  }
  if (body.is_active !== undefined) changes.is_active = parseActive(body.is_active);
  if (body.current_sem !== undefined) changes.current_sem = parseSemesterId(body.current_sem);

  let before;
  let after;
  await withTransaction(async (client) => {
    await AcademicYearModel.lockWrites(client);

    before = await AcademicYearModel.findById(yearId, client);
    if (!before) throw new HttpError(404, 'Academic year not found.');

    if (changes.year_label !== undefined) await assertYearLabelFree(changes.year_label, client, yearId);
    if (changes.is_active === false && before.is_active) {
      throw new HttpError(
        400,
        'Cannot deactivate the active academic year. Activate another year instead.'
      );
    }

    after = await AcademicYearModel.update(yearId, changes, client);
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'academic_year',
    recordId: yearId,
    action: 'ACADEMIC_YEAR_UPDATED',
    oldValues: yearSnapshot(before),
    newValues: yearSnapshot(after),
  });

  res.json({ success: true, message: 'Academic year updated successfully.', data: after });
};

/** PUT /academic-years/:year_id/semester  Body: { current_sem } */
exports.updateAcademicYearSemester = async (req, res) => {
  const yearId = parseId(req.params.year_id);
  const currentSem = parseId(req.body?.current_sem);

  const before = await AcademicYearModel.findById(yearId);
  if (!before) throw new HttpError(404, 'Academic year not found.');

  const after = await AcademicYearModel.updateSemester(yearId, currentSem).catch(translateDbError);

  await audit(req, {
    tableName: 'academic_year',
    recordId: yearId,
    action: 'SEMESTER_CHANGED',
    oldValues: { current_sem: before.current_sem },
    newValues: { current_sem: currentSem },
  });

  res.json({ success: true, message: 'Semester updated successfully.', data: after });
};

/** PUT /academic-years/:year_id/activate  Makes this the only active year. */
exports.activateAcademicYear = async (req, res) => {
  const yearId = parseId(req.params.year_id);

  let before;
  let after;
  await withTransaction(async (client) => {
    await AcademicYearModel.lockWrites(client);

    before = await AcademicYearModel.findById(yearId, client);
    if (!before) throw new HttpError(404, 'Academic year not found.');

    after = await AcademicYearModel.setActive(yearId, client);
  });

  await audit(req, {
    tableName: 'academic_year',
    recordId: yearId,
    action: 'ACADEMIC_YEAR_ACTIVATED',
    oldValues: { is_active: before.is_active },
    newValues: { is_active: true },
  });

  res.json({ success: true, message: 'Academic year activated successfully.', data: after });
};

// ---------------------------------------------------------------------------
// Curricula
// ---------------------------------------------------------------------------

/** GET /curricula */
exports.getCurricula = async (req, res) => {
  const curricula = await CurriculumModel.getAll();
  res.json({ success: true, data: curricula });
};

/** POST /curricula  Creating an active curriculum deactivates the program's others. */
exports.addCurriculum = async (req, res) => {
  const body = req.body ?? {};
  if (!body.program_id || !body.start_year || !body.version_name) {
    throw new HttpError(400, 'Program, start year, and version are required.');
  }

  const input = {
    program_id: parseId(body.program_id),
    start_year: parseStartYear(body.start_year),
    version_name: parseRequiredText(body.version_name, 'Program, start year, and version are required.'),
    is_active: body.is_active === undefined ? false : parseActive(body.is_active),
  };

  let curriculum;
  await withTransaction(async (client) => {
    await CurriculumModel.lockProgram(input.program_id, client);
    await assertCurriculumFree(input, client);
    curriculum = await CurriculumModel.create(input, client);
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'curricula',
    recordId: curriculum.curriculum_id,
    action: 'CURRICULUM_CREATED',
    oldValues: null,
    newValues: { curriculum_id: curriculum.curriculum_id, ...curriculumSnapshot(curriculum) },
  });

  res.json({ success: true, message: 'Curriculum created successfully.', data: curriculum });
};

/** PUT /curricula/:curriculum_id  Fields that are not sent are left unchanged. */
exports.updateCurriculum = async (req, res) => {
  const curriculumId = parseId(req.params.curriculum_id);
  const body = req.body ?? {};

  const changes = {};
  if (body.program_id !== undefined) changes.program_id = parseId(body.program_id);
  if (body.start_year !== undefined) changes.start_year = parseStartYear(body.start_year);
  if (body.version_name !== undefined) {
    changes.version_name = parseRequiredText(body.version_name, 'Version name cannot be empty.');
  }
  if (body.is_active !== undefined) changes.is_active = parseActive(body.is_active);

  let before;
  let after;
  await withTransaction(async (client) => {
    before = await CurriculumModel.getById(curriculumId, client);
    if (!before) throw new HttpError(404, 'Curriculum not found.');

    const merged = { ...before, ...changes };
    await CurriculumModel.lockProgram(merged.program_id, client);
    await assertCurriculumFree(merged, client, curriculumId);

    after = await CurriculumModel.update(curriculumId, changes, { programId: merged.program_id }, client);
  }).catch(translateDbError);

  await audit(req, {
    tableName: 'curricula',
    recordId: curriculumId,
    action: 'CURRICULUM_UPDATED',
    oldValues: curriculumSnapshot(before),
    newValues: curriculumSnapshot(after),
  });

  res.json({ success: true, message: 'Curriculum updated successfully.', data: after });
};