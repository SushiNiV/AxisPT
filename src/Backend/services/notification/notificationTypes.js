'use strict';

/**
 * The notification types the app knows about. Keep in sync with the frontend
 * resolver (notificationRoutes.js), which decides where each type redirects.
 */
const TYPES = Object.freeze({
  ANNOUNCEMENT: 'announcement',
  GRADE_POSTED: 'grade_posted',
  INCOMPLETE_GRADE: 'incomplete_grade',
  STANDING_CHANGED: 'standing_changed',
  STUDENTS_AT_RISK: 'students_at_risk',
  ACCOUNT: 'account',
  ENROLLMENT: 'enrollment', // reserved: no producer yet
  SYSTEM: 'system',         // reserved: no producer yet
});

const SEVERITIES = Object.freeze(['info', 'warning', 'critical']);

module.exports = { TYPES, SEVERITIES };