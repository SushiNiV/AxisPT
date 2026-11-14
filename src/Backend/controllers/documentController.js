'use strict';

/**
 * Document controller: data for the printable documents (student form, term
 * grade report, course outline). Read-only.
 *
 * Conventions: success is { success: true, data }; failures are thrown as
 * HttpError and handled by the global error handler.
 */

const DocumentModel = require('../models/documentModel');
const HttpError = require('../../utils/httpError');
const { parseId } = require('../../utils/request');

/** Year levels and semester ids the documents accept. */
const YEAR_LEVEL_RANGE = { min: 1, max: 5 };
const SEMESTER_RANGE = { min: 1, max: 3 };

/** Parse an optional whole-number query value within a range; undefined passes through. */
function parseOptionalInRange(value, name, { min, max }) {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < min || n > max) {
    throw new HttpError(400, `Invalid ${name}: ${value}. Must be between ${min} and ${max}.`);
  }
  return n;
}

/** GET /student-form/:id */
exports.getStudentFormById = async (req, res) => {
  const student = await DocumentModel.getStudentFormData(parseId(req.params.id));
  if (!student) throw new HttpError(404, 'Student record not found.');
  res.status(200).json({ success: true, data: student });
};

/** GET  The signed-in student's own form. */
exports.getStudentFormMe = async (req, res) => {
  const studentId = req.user?.student_id ?? await DocumentModel.findStudentIdByUserId(req.user.id);
  if (!studentId) throw new HttpError(404, 'Student record not found.');

  const student = await DocumentModel.getStudentFormData(studentId);
  if (!student) throw new HttpError(404, 'Student record not found.');
  res.status(200).json({ success: true, data: student });
};

/** GET /term-grade/:id?yearLevel=&semesterId= */
exports.getTermGradeById = async (req, res) => {
  const studentId = parseId(req.params.id);

  const period = {};
  const yearLevel = parseOptionalInRange(req.query.yearLevel, 'yearLevel', YEAR_LEVEL_RANGE);
  const semesterId = parseOptionalInRange(req.query.semesterId, 'semesterId', SEMESTER_RANGE);
  if (yearLevel !== undefined) period.yearLevel = yearLevel;
  if (semesterId !== undefined) period.semesterId = semesterId;

  const termGrade = await DocumentModel.getTermGradeData(studentId, period);
  if (!termGrade) {
    throw new HttpError(
      404,
      'No enrollment record found for this student/period, so a term grade document could not be built.'
    );
  }
  res.status(200).json({ success: true, data: termGrade });
};

/** GET /course-outline/:id  The signed-in user is named as evaluator. */
exports.getCourseOutlineById = async (req, res) => {
  const outline = await DocumentModel.getCourseOutlineDataByStudent(parseId(req.params.id), req.user);
  if (!outline) {
    throw new HttpError(404, 'No curriculum found for this student, so a course outline could not be built.');
  }
  res.status(200).json({ success: true, data: outline });
};