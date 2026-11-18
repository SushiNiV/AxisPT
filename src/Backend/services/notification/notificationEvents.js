'use strict';

/**
 * Ready-made producers. Call them from the code that causes the event, AFTER the
 * change has been saved. None of them throw; do not await them if you do not
 * want the request to wait.
 */
const db = require('../../config/db');
const { notify } = require('./notificationService');
const { TYPES } = require('./notificationTypes');

async function userIdForStudent(studentId) {
  const { rows } = await db.query('SELECT user_id FROM students WHERE student_id = $1', [studentId]);
  return rows[0]?.user_id ?? null;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Grades were added or changed for a student. One notification per student per
 * day (later changes the same day re-raise it), so a bulk upload does not flood
 * anyone.
 */
async function notifyGradesPosted(studentId) {
  try {
    const userId = await userIdForStudent(studentId);
    await notify({
      userId,
      type: TYPES.GRADE_POSTED,
      title: 'Your grades were updated',
      body: 'New or changed grades are available in your academics page.',
      data: { studentId },
      dedupeKey: `grades-${studentId}-${today()}`,
    });
  } catch (err) {
    console.error('[notifyGradesPosted]', err.message);
  }
}

/** A grade was recorded as incomplete (INC). One notification per student per course. */
async function notifyIncompleteGrade(studentId, { courseId, courseCode, courseName }) {
  try {
    const userId = await userIdForStudent(studentId);
    await notify({
      userId,
      type: TYPES.INCOMPLETE_GRADE,
      title: 'You have an incomplete grade',
      body: `${courseCode || courseName || 'A course'} was marked incomplete. Check the requirements to complete it.`,
      severity: 'warning',
      data: { studentId, courseId },
      dedupeKey: `incomplete-${studentId}-${courseId}`,
    });
  } catch (err) {
    console.error('[notifyIncompleteGrade]', err.message);
  }
}

const ACCOUNT_EVENTS = {
  password_changed: {
    title: 'Your password was changed',
    body: 'If this was not you, contact an administrator right away.',
    severity: 'warning',
  },
  account_activated: {
    title: 'Your account is active',
    body: 'Your account has been activated.',
    severity: 'info',
  },
};

/** @param {number} userId @param {'password_changed'|'account_activated'} event */
async function notifyAccountEvent(userId, event) {
  const e = ACCOUNT_EVENTS[event];
  if (!e) return;
  await notify({ userId, type: TYPES.ACCOUNT, ...e, data: { event } });
}

module.exports = { notifyGradesPosted, notifyIncompleteGrade, notifyAccountEvent };