'use strict';

/**
 * Student portal controller: the signed-in student's own grades, subjects and
 * profile. The student is always taken from the verified token (`student_id`),
 * never from the request.
 *
 * Conventions: success is { success: true, data } or { success: true, message };
 * failures are thrown as HttpError and handled by the global error handler.
 */

const StudentPortalModel = require('../models/studentportalModel');
const HttpError = require('../../utils/httpError');

/** The student id from the token; 403 if the account is not a student account. */
function currentStudentId(req) {
  const studentId = req.user?.student_id;
  if (!studentId) throw new HttpError(403, 'A student account is required.');
  return studentId;
}

/** GET  My grades, with score components. Archived grades are hidden. */
exports.getMyGrades = async (req, res) => {
  const data = await StudentPortalModel.getGrades(currentStudentId(req));
  res.json({ success: true, data });
};

/** GET  The courses of my current term. */
exports.getMySubjects = async (req, res) => {
  const data = await StudentPortalModel.getCurrentSubjects(currentStudentId(req));
  res.json({ success: true, data });
};

/** GET  My profile. */
exports.getMyProfile = async (req, res) => {
  const profile = await StudentPortalModel.getProfile(currentStudentId(req));
  if (!profile) throw new HttpError(404, 'Profile not found.');
  res.json({ success: true, data: profile });
};

/** PUT  Update my profile. Only the sections that appear in the body are changed. */
exports.updateMyProfile = async (req, res) => {
  await StudentPortalModel.updateProfile(currentStudentId(req), req.body ?? {});
  res.json({ success: true, message: 'Profile updated successfully.' });
};