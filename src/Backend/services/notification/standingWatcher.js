'use strict';

/**
 * Detects academic-standing changes by comparing the standing computed now with
 * the last one stored in student_standing_snapshot, then notifies:
 *  - the student (standing_changed), for any change;
 *  - program faculty and admins (students_at_risk), as ONE digest with counts
 *    when students worsened. No student names are put in notifications.
 *
 * The first run only records a baseline and sends nothing, so deploying this
 * does not announce everyone's existing standing.
 */
const db = require('../../config/db');
const GradeManageModel = require('../../models/grademanageModel');
const { notify, notifyMany } = require('./notificationService');
const { TYPES } = require('./notificationTypes');

const RANK = { None: 0, Warning: 1, 'Probationary 1': 2, 'Probationary 2': 3 };
const rank = (status) => RANK[status] ?? 0;

/** Pure: splits students into changed ones and ones never seen before. */
function diffStandings(students, currentById, knownById) {
  const changes = [];
  const fresh = [];
  for (const s of students) {
    const status = currentById.get(s.student_id) || 'None';
    if (!knownById.has(s.student_id)) {
      fresh.push({ ...s, status });
    } else if (knownById.get(s.student_id) !== status) {
      changes.push({ ...s, previous: knownById.get(s.student_id), status });
    }
  }
  return { changes, fresh };
}

function studentMessage(previous, status) {
  const improved = rank(status) < rank(previous);
  if (status === 'None') {
    return { title: 'Your academic standing improved', body: 'You are now in good standing.', severity: 'info' };
  }
  return {
    title: improved ? 'Your academic standing improved' : 'Your academic standing changed',
    body: `Your standing is now ${status}. Open your academics page for details.`,
    severity: rank(status) >= 2 ? 'critical' : 'warning',
  };
}

async function loadStudents() {
  const { rows } = await db.query(
    `SELECT DISTINCT ON (s.student_id) s.student_id, s.user_id, c.program_id
       FROM students s
       LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
       LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
      WHERE s.archived_at IS NULL AND s.account_status = TRUE
      ORDER BY s.student_id, se.education_id DESC NULLS LAST`
  );
  return rows;
}

async function saveSnapshots(entries) {
  if (!entries.length) return;
  await db.query(
    `INSERT INTO student_standing_snapshot (student_id, status, updated_at)
     SELECT t.student_id, t.status, now()
       FROM unnest($1::int[], $2::text[]) AS t(student_id, status)
     ON CONFLICT (student_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
    [entries.map((e) => e.student_id), entries.map((e) => e.status)]
  );
}

async function facultyUserIds(programId) {
  const { rows } = await db.query(
    'SELECT user_id FROM faculties WHERE program_id = $1 AND account_status = TRUE AND user_id IS NOT NULL',
    [programId]
  );
  return rows.map((r) => r.user_id);
}

async function adminUserIds() {
  const { rows } = await db.query(
    `SELECT DISTINCT u.user_id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
      WHERE u.is_active = true AND UPPER(r.role_name) IN ('ADMIN', 'SUPERADMIN')`
  );
  return rows.map((r) => r.user_id);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** @returns {Promise<{ baseline: boolean, changed: number, worsened: number }>} */
async function checkStandings() {
  const students = await loadStudents();
  if (!students.length) return { baseline: false, changed: 0, worsened: 0 };

  const ids = students.map((s) => s.student_id);
  const standingMap = await GradeManageModel.getAcademicStandingMap(ids);
  const currentById = new Map(ids.map((id) => [id, standingMap.get(id)?.status || 'None']));

  const { rows: snaps } = await db.query('SELECT student_id, status FROM student_standing_snapshot');
  const knownById = new Map(snaps.map((r) => [r.student_id, r.status]));
  const baseline = knownById.size === 0;

  const { changes, fresh } = diffStandings(students, currentById, knownById);

  // Save first, so a crash while notifying never causes duplicates on the next run.
  await saveSnapshots([...fresh, ...changes]);
  if (baseline) return { baseline: true, changed: 0, worsened: 0 };

  // 1. The student
  for (const c of changes) {
    await notify({
      userId: c.user_id,
      type: TYPES.STANDING_CHANGED,
      ...studentMessage(c.previous, c.status),
      data: { status: c.status, previous: c.previous },
      dedupeKey: `standing-${c.student_id}-${c.status}`,
    });
  }

  // 2. Staff digest of students who worsened
  const worsened = changes.filter((c) => rank(c.status) >= 1 && rank(c.status) > rank(c.previous));
  if (worsened.length) {
    const runId = Date.now();
    const byProgram = new Map();
    for (const w of worsened) {
      if (w.program_id) byProgram.set(w.program_id, (byProgram.get(w.program_id) || 0) + 1);
    }

    const { rows: programs } = await db.query('SELECT program_id, program_abbr FROM programs');
    const abbr = new Map(programs.map((p) => [p.program_id, p.program_abbr]));

    for (const [programId, count] of byProgram) {
      await notifyMany(await facultyUserIds(programId), {
        type: TYPES.STUDENTS_AT_RISK,
        title: `${plural(count, 'student')} newly at risk`,
        body: `${abbr.get(programId) || 'Your program'}: academic standing worsened since the last check.`,
        severity: 'warning',
        data: { count, programId },
        dedupeKey: `at-risk-${programId}-${runId}`,
      });
    }

    await notifyMany(await adminUserIds(), {
      type: TYPES.STUDENTS_AT_RISK,
      title: `${plural(worsened.length, 'student')} newly at risk`,
      body: 'Academic standing worsened since the last check.',
      severity: 'warning',
      data: { count: worsened.length, programId: null },
      dedupeKey: `at-risk-all-${runId}`,
    });
  }

  return { baseline: false, changed: changes.length, worsened: worsened.length };
}

module.exports = { checkStandings, diffStandings };