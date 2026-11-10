const CourseModel = require('../models/courseModel');
const { withTransaction } = require('../../utils/transaction');
const { audit } = require('../../utils/audit');
const { parseId } = require('../../utils/request');
const HttpError = require('../../utils/httpError');

// HTTP only. Errors are thrown as HttpError; Express 5 forwards them to the
// global error handler, so no try/catch/finally is needed here.

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const toHttpError = (err) => {
  if (err.code === UNIQUE_VIOLATION) return new HttpError(400, 'Course code already exists.');
  if (err.code === FOREIGN_KEY_VIOLATION) return new HttpError(400, 'Invalid curriculum or semester in assignments.');
  return err;
};

const toUnits = (v) => Number.parseInt(v, 10) || 0;

/** Validate and normalize the body shared by create and update. */
function parseCourseBody(body = {}) {
  const { course_code, course_name, lec_units, lab_units, course_desc, grading_scheme, prerequisites, assignments } = body;

  if (typeof course_code !== 'string' || typeof course_name !== 'string' || !course_code.trim() || !course_name.trim()) {
    throw new HttpError(400, 'Course code and name are required.');
  }

  const list = Array.isArray(assignments) ? assignments : [];
  for (const a of list) {
    if (!a || !Number.isInteger(Number(a.curriculum_id))) {
      throw new HttpError(400, 'Each assignment needs a valid curriculum.');
    }
  }

  return {
    course_code: course_code.trim().toUpperCase(),
    course_name: course_name.trim().toUpperCase(),
    lec_units: toUnits(lec_units),
    lab_units: toUnits(lab_units),
    course_desc: course_desc || null,
    grading_scheme: grading_scheme || null,
    prerequisites: prerequisites || [],
    assignments: list.map((a) => ({ ...a, curriculum_id: Number(a.curriculum_id) })),
  };
}

// ------------------------------------------------------------------- reads
exports.getCourses = async (req, res) => {
  // Archived courses are only visible to admins (this route is also open to faculty).
  const includeArchived = req.query.includeArchived === 'true' && req.user.role === 'admin';
  res.json({ success: true, data: await CourseModel.getAll(includeArchived) });
};

exports.getCourseById = async (req, res) => {
  const course = await CourseModel.getById(parseId(req.params.id));
  if (!course) throw new HttpError(404, 'Course not found.');
  res.json({ success: true, data: course });
};

// ------------------------------------------------------------------ create
exports.addCourse = async (req, res) => {
  const data = parseCourseBody(req.body);
  if (data.assignments.length === 0) {
    throw new HttpError(400, 'Please add at least one curriculum assignment.');
  }
  // Checked with the normalized (uppercase) code: that is what gets stored.
  if (await CourseModel.getByCode(data.course_code)) {
    throw new HttpError(400, 'Course code already exists.');
  }

  let course;
  try {
    course = await withTransaction(async (client) => {
      const created = await CourseModel.create({ ...data, is_active: true }, client);
      for (const a of data.assignments) {
        await CourseModel.addToCurriculum(a.curriculum_id, created.course_id, a.year_level, a.semester_id, client);
      }
      return created;
    });
  } catch (err) {
    throw toHttpError(err);
  }

  await audit(req, {
    tableName: 'courses', recordId: course.course_id, action: 'COURSE_CREATED', oldValues: null,
    newValues: {
      course_id: course.course_id, course_code: course.course_code,
      course_name: course.course_name, timestamp: new Date().toISOString(),
    },
  });

  res.json({ success: true, message: 'Course created successfully.', data: course });
};

// ------------------------------------------------------------------ update
exports.updateCourse = async (req, res) => {
  const id = parseId(req.params.id);
  const data = parseCourseBody(req.body);

  const before = await CourseModel.getById(id);
  if (!before) throw new HttpError(404, 'Course not found.');

  // Fields the client did not send keep their current value (they used to be wiped).
  const sent = req.body ?? {};
  for (const field of ['lec_units', 'lab_units', 'course_desc', 'grading_scheme', 'prerequisites']) {
    if (sent[field] === undefined) data[field] = before[field];
  }

  if (data.course_code !== before.course_code) {
    const clash = await CourseModel.getByCode(data.course_code);
    if (clash && clash.course_id !== id) throw new HttpError(400, 'Course code already exists.');
  }

  try {
    // One transaction: a failure can no longer leave the course without its assignments.
    await withTransaction(async (client) => {
      await CourseModel.update(id, data, client);
      if (data.assignments.length > 0) await CourseModel.replaceAssignments(id, data.assignments, client);
    });
  } catch (err) {
    throw toHttpError(err);
  }

  const after = await CourseModel.getById(id);
  await audit(req, {
    tableName: 'courses', recordId: id, action: 'COURSE_UPDATED',
    oldValues: before, newValues: after,
  });

  res.json({ success: true, message: 'Course updated successfully.', data: after });
};

// ------------------------------------------------------- archive / restore
exports.deleteCourse = async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await CourseModel.archive(id))) throw new HttpError(404, 'Course not found.');

  await audit(req, {
    tableName: 'courses', recordId: id, action: 'COURSE_ARCHIVED',
    oldValues: { is_archived: false },
    newValues: { is_archived: true, timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'Course archived successfully.' });
};

exports.restoreCourse = async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await CourseModel.restore(id))) throw new HttpError(404, 'Course not found.');

  await audit(req, {
    tableName: 'courses', recordId: id, action: 'COURSE_RESTORED',
    oldValues: { is_archived: true },
    newValues: { is_archived: false, timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'Course restored successfully.' });
};