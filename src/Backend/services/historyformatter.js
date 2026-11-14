'use strict';

/**
 * Turns an audit-log row (as returned by HistoryModel.getHistoryLogs) into the
 * shape the History page shows. Pure: no database access, no side effects.
 *
 * To describe a new action, add an entry to DETAIL_BUILDERS. Actions without an
 * entry still display, using a generic sentence built from the action name.
 */

/** Times are shown in the school's time zone, whatever the server's is. */
const DISPLAY_TIME_ZONE = 'Asia/Manila';

const SEMESTER_NAMES = { 1: '1st Semester', 2: '2nd Semester', 3: 'Summer' };

/** "STUDENT_ARCHIVED" -> "Student Archived". */
const titleCase = (action) =>
  action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Who did it: the faculty name, else the username, else "System". */
function actorName(item) {
  if (item.first_name && item.last_name) return `${item.first_name} ${item.last_name}`;
  if (item.user_name) return item.user_name;
  return 'System';
}

/** The actor's role label for the table. */
function actorDesignation(item) {
  if (item.designation_name && item.designation_name !== 'Unknown') return item.designation_name;
  if (item.roles?.includes('SUPERADMIN')) return 'Developer';
  if (item.roles?.includes('ADMIN')) return 'Admin';
  return 'Unknown';
}

/**
 * What a record is called in a sentence: the first of the given name fields in
 * the log, else "#<id>". The id comes from the log's own id field, else from the
 * row's record_id (so entries that only store the changed values still read well).
 */
const named = (item, values, nameKeys, idKey) =>
  nameKeys.map((key) => values[key]).find(Boolean) || `#${values[idKey] ?? item.record_id}`;

/** A student's name: stored in the log, else looked up from the record, else the number. */
const studentName = (item, values) =>
  values.student_name || item.record_student_name || values.student_number
  || `#${values.student_id ?? item.record_id}`;

/** Sentence builders, keyed by action. Each gets { who, values, item }. */
const DETAIL_BUILDERS = {
  LOGIN_SUCCESS: ({ who, values }) =>
    `${who} logged in${values.designation ? ` as ${values.designation}` : ''}`,
  LOGIN_FAILED: ({ who, values }) =>
    `${who} failed to log in - ${values.reason || 'Invalid credentials'}`,
  PASSWORD_CHANGED: ({ who }) => `${who} changed their password`,

  // Programs
  PROGRAM_CREATED: ({ who, values }) =>
    `${who} created program ${values.program_name || ''} (${values.program_abbr || ''})`,
  PROGRAM_UPDATED: ({ who, values }) =>
    `${who} updated program ${values.program_name || ''} (${values.program_abbr || ''})`,
  PROGRAM_ARCHIVED: ({ who, values, item }) =>
    `${who} archived program ${named(item, values, ['program_name'], 'program_id')}`,
  PROGRAM_RESTORED: ({ who, values, item }) =>
    `${who} restored program ${named(item, values, ['program_name'], 'program_id')}`,

  // Sections
  SECTION_ARCHIVED: ({ who, values, item }) =>
    `${who} archived section ${named(item, values, ['section_name'], 'assignment_id')}`,
  SECTION_RESTORED: ({ who, values, item }) =>
    `${who} restored section ${named(item, values, ['section_name'], 'assignment_id')}`,

  // Curricula
  CURRICULUM_CREATED: ({ who, values }) =>
    `${who} created curriculum (${values.version_name || 'New Version'}) for program ${values.program_name || `#${values.program_id}`}`,
  CURRICULUM_UPDATED: ({ who, values }) =>
    `${who} updated curriculum (${values.version_name || 'New Version'}) for program ${values.program_name || `#${values.program_id}`}`,

  // Courses
  COURSE_CREATED: ({ who, values }) =>
    `${who} created course ${values.course_code || ''} (${values.course_name || ''})`,
  COURSE_UPDATED: ({ who, values }) =>
    `${who} updated course ${values.course_code || ''} (${values.course_name || ''})`,
  COURSE_ARCHIVED: ({ who, values, item }) =>
    `${who} archived course ${named(item, values, ['course_code'], 'course_id')}`,
  COURSE_RESTORED: ({ who, values, item }) =>
    `${who} restored course ${named(item, values, ['course_code'], 'course_id')}`,

  // Students
  STUDENT_CREATED: ({ who, values, item }) =>
    `${who} created student ${studentName(item, values)}`,
  STUDENT_UPDATED: ({ who, values, item }) =>
    `${who} updated student ${studentName(item, values)}`,
  STUDENT_ARCHIVED: ({ who, values, item }) =>
    `${who} archived student ${studentName(item, values)}${values.reason ? ` (${values.reason})` : ''}`,
  STUDENT_RESTORED: ({ who, values, item }) =>
    `${who} restored student ${studentName(item, values)}`,

  // Grades
  GRADE_ARCHIVED: ({ who, values }) =>
    `${who} archived a grade for ${values.course_code || `course #${values.course_id}`}${values.reason ? ` (${values.reason})` : ''}`,
    GRADE_DELETED: ({ who, values }) =>
    `${who} deleted a grade for ${values.course_code || `course #${values.course_id}`}`,
  GRADE_RESTORED: ({ who, values }) =>
    `${who} restored a grade for ${values.course_code || `course #${values.course_id}`}`,
  PREREQ_OVERRIDE: ({ who, values }) =>
    `${who} overrode prerequisites for ${values.course_code || `course #${values.course_id}`}`,

  // Academic years
  ACADEMIC_YEAR_CREATED: ({ who, values }) =>
    `${who} created academic year ${values.year_label || ''}`,
  ACADEMIC_YEAR_UPDATED: ({ who, values }) =>
    `${who} updated academic year ${values.year_label || ''}`,
  ACADEMIC_YEAR_ACTIVATED: ({ who, values, item }) =>
    `${who} set academic year ${values.year_label || `#${item.record_id}`} as active`,
  SEMESTER_CHANGED: ({ who, values }) =>
    `${who} changed the current term to ${SEMESTER_NAMES[values.current_sem] || 'None'}`,

  // Accounts and announcements
  FACULTY_CREATED: ({ who, values }) => `${who} created user ${values.username || ''}`,
  FACULTY_UPDATED: ({ who, values }) => `${who} updated user ${values.username || ''}`,
  ANNOUNCEMENT_CREATED: ({ who, values }) =>
    `${who} posted an announcement${values.title ? `: ${values.title}` : ''}`,
  ANNOUNCEMENT_DELETED: ({ who, values }) =>
    `${who} deleted an announcement${values.title ? `: ${values.title}` : ''}`,
};

/**
 * @param {object} item  a row from HistoryModel.getHistoryLogs
 * @returns {{ log_id: number, user_id: number|null, username: string, designation: string,
 *             action: string, target_id: number|null, target_username: string,
 *             details: string, timestamp: string, timestamp_iso: string|null }}
 */
function formatHistoryEntry(item) {
  const who = actorName(item);
  const label = titleCase(item.action);
  const genericSentence = `${who} ${label.toLowerCase()}`;

  // Specific sentences need the stored values; without them the generic one is used.
  const values = item.new_values && typeof item.new_values === 'object' ? item.new_values : null;
  let details;
  if (!values) {
    details = genericSentence;
  } else {
    const build = DETAIL_BUILDERS[item.action];
    details = build ? build({ who, values, item }) : (values.details || genericSentence);
  }

  const createdAt = new Date(item.created_at);
  return {
    log_id: item.id,
    user_id: item.user_id,
    username: who,
    designation: actorDesignation(item),
    action: label,
    target_id: item.target_user_id,
    target_username: item.target_user_name || 'System',
    details,
    timestamp: createdAt.toLocaleString('en-US', { timeZone: DISPLAY_TIME_ZONE }),
    timestamp_iso: Number.isNaN(createdAt.getTime()) ? null : createdAt.toISOString(),
  };
}

module.exports = { formatHistoryEntry, DETAIL_BUILDERS, DISPLAY_TIME_ZONE };