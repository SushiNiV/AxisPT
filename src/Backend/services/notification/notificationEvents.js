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
    email: true,
  },
  password_reset: {
    title: 'Your password was reset',
    body: 'Your password was reset using the forgot-password link. If this was not you, contact an administrator right away.',
    severity: 'warning',
    email: true,
  },
  account_activated: {
    title: 'Your account is active',
    body: 'Your account has been activated.',
    severity: 'info',
    email: false,
  },
};

async function schoolEmailFor(userId) {
  const { rows } = await db.query('SELECT school_email FROM users WHERE user_id = $1', [userId]);
  return rows[0]?.school_email ?? null;
}

/** Email text carries the time and device; the in-app text stays free of personal details. */
function emailText(e, ctx) {
  const when = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
  return `${e.body}\n\nTime: ${when}\nDevice: ${ctx.userAgent || 'unknown'}\nIP: ${ctx.ipAddress || 'unknown'}\n\nAxis Portal`;
}

/**
 * @param {number} userId
 * @param {'password_changed'|'password_reset'|'account_activated'} event
 * @param {{ ctx?: { ipAddress?: string, userAgent?: string } }} [options]
 * Raises the in-app notification and, for events marked `email`, emails the user's school email.
 * Never throws.
 */
async function notifyAccountEvent(userId, event, { ctx = {} } = {}) {
  const e = ACCOUNT_EVENTS[event];
  if (!e) return;
  try {
    let email = null;
    if (e.email) {
      const to = await schoolEmailFor(userId);
      if (to) email = { to, text: emailText(e, ctx) };
    }
    const { email: _wantsEmail, ...content } = e;
    await notify({ userId, type: TYPES.ACCOUNT, ...content, data: { event }, email });
  } catch (err) {
    console.error('[notifyAccountEvent]', err.message);
  }
}

/**
 * An admin manually set a student's probation status. Raises one in-app notification
 * (re-raised with the latest status if changed again) and emails the student.
 * The email stays generic; the status is only shown inside the app.
 */
async function notifyProbationChanged(userId, status) {
  try {
    if (!userId || !status) return;
    const cleared = status === 'None';
    const body = cleared
      ? 'You are no longer on probation.'
      : `Your probation status is now ${status}. Open your academics page for details.`;
    const to = await schoolEmailFor(userId);
    await notify({
      userId,
      type: TYPES.STANDING_CHANGED,
      title: cleared ? 'Your probation status was cleared' : 'Your academic status changed',
      body,
      severity: cleared ? 'info' : status === 'Warning' ? 'warning' : 'critical',
      data: { status, manual: true },
      dedupeKey: `probation-manual-${userId}`,
      email: to
        ? { to, text: 'Your academic status was updated. Open Axis for details.\n\nAxis Portal' }
        : null,
    });
  } catch (err) {
    console.error('[notifyProbationChanged]', err.message);
  }
}

module.exports = { notifyGradesPosted, notifyIncompleteGrade, notifyAccountEvent, notifyProbationChanged };