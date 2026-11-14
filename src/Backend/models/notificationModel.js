'use strict';

/**
 * Notification model: per-user notifications (the bell) and announcements.
 *
 * Announcements are stored once and fanned out into one notification per
 * recipient. A notification's `dedupe_key` (unique per user) stops the same
 * event from being delivered twice.
 *
 * This module exports plain functions, not a class: other modules call
 * `upsertNotification` directly to raise notifications.
 */

const pool = require('../config/db');
const HttpError = require('../../utils/httpError');
const { withTransaction } = require('../../utils/transaction');

const NOTIFICATION_RETENTION_DAYS = 45;
const ANNOUNCEMENT_LINK = '/dashboard';

/** Prefix of the dedupe key that links an announcement to its notifications. */
const announcementDedupeKey = (announcementId) => `announcement-${announcementId}`;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * Create a notification, or mark an existing one with the same dedupe key unread
 * again. Without a `dedupeKey` a new row is always created.
 * @param {{ userId: number, type: string, title: string, body?: string, link?: string,
 *           data?: object, dedupeKey?: string }} notification
 * @returns {Promise<object>} the notification row
 */
async function upsertNotification({ userId, type, title, body, link, data = {}, dedupeKey }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, link, data, dedupe_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
     DO UPDATE SET read_at = NULL
     RETURNING *`,
    [userId, type, title, body, link, data, dedupeKey]
  );
  return rows[0];
}

/**
 * Cursors look like "<created_at>|<notification_id>". The timestamp is written
 * with microseconds (taken from the database, not from a JavaScript Date, which
 * only has milliseconds), so notifications created in the same millisecond are
 * neither skipped nor repeated between pages.
 */
const CURSOR_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}Z)\|(\d{1,19})$/;

function decodeCursor(cursor) {
  const match = CURSOR_PATTERN.exec(cursor);
  if (!match) throw new HttpError(400, 'Invalid cursor.');
  return { createdAt: match[1], id: match[2] };
}

/**
 * One page of a user's notifications, newest first.
 * @param {number} userId
 * @param {number} [limit=20]
 * @param {string|null} [cursor]  `nextCursor` from the previous page
 * @returns {Promise<{ items: object[], nextCursor: string|null }>}
 * @throws {HttpError} 400 for a malformed cursor
 */
async function getNotifications(userId, limit = 20, cursor = null) {
  const values = [userId];
  let cursorFilter = '';

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    values.push(createdAt, id);
    cursorFilter = 'AND (created_at, notification_id) < ($2::timestamptz, $3::bigint)';
  }

  values.push(limit + 1); // one extra row tells us whether there is a next page
  const { rows } = await pool.query(
    `SELECT notification_id, type, title, body, link, data, created_at, read_at,
            to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts
       FROM notifications
      WHERE user_id = $1 ${cursorFilter}
      ORDER BY created_at DESC, notification_id DESC
      LIMIT $${values.length}`,
    values
  );

  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const last = rows[rows.length - 1];
  const nextCursor = hasMore ? `${last.cursor_ts}|${last.notification_id}` : null;

  return { items: rows.map(({ cursor_ts, ...item }) => item), nextCursor };
}

/** @returns {Promise<number>} how many notifications the user has not read */
async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::integer AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return rows[0].count;
}

/** Mark one of the user's notifications as read. Another user's id changes nothing. */
async function markRead(userId, notificationId) {
  await pool.query(
    'UPDATE notifications SET read_at = now() WHERE notification_id = $1 AND user_id = $2 AND read_at IS NULL',
    [notificationId, userId]
  );
}

async function markAllRead(userId) {
  await pool.query(
    'UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

/**
 * The program a student or faculty member belongs to, or null.
 * @param {number} userId
 * @param {'student'|'faculty'} role
 * @returns {Promise<number|null>}
 */
async function getProgramIdForUser(userId, role) {
  const queries = {
    student: `SELECT c.program_id
                FROM students s
                JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
                JOIN curricula c ON c.curriculum_id = se.curriculum_id
               WHERE s.user_id = $1
               LIMIT 1`,
    faculty: 'SELECT program_id FROM faculties WHERE user_id = $1 LIMIT 1',
  };
  if (!queries[role]) return null;

  const { rows } = await pool.query(queries[role], [userId]);
  return rows[0]?.program_id ?? null;
}

/**
 * @param {{ title: string, body: string, audience: 'all'|'students'|'faculty',
 *           programId?: number|null, createdBy: number }} announcement
 * @returns {Promise<object>} the announcement row
 * @throws pg error 23503 if the program does not exist
 */
async function createAnnouncement({ title, body, audience, programId, createdBy }) {
  const { rows } = await pool.query(
    `INSERT INTO announcements (title, body, audience, program_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, body, audience, programId, createdBy]
  );
  return rows[0];
}

/**
 * Active announcements for an audience. An announcement with no program is for
 * everyone; one with a program is only returned when `programId` matches.
 * @param {'all'|'students'|'faculty'} audience
 * @param {number|null} programId
 * @returns {Promise<object[]>}
 */
async function getAnnouncements(audience, programId) {
  const { rows } = await pool.query(
    `SELECT announcement_id, title, body, audience, program_id, created_at
       FROM announcements
      WHERE archived_at IS NULL
        AND (audience = 'all' OR audience = $1)
        AND (program_id IS NULL OR program_id = $2)
      ORDER BY created_at DESC`,
    [audience, programId]
  );
  return rows;
}

/**
 * Delete an announcement together with the notifications it created, so
 * recipients are not left with a notification for something that no longer exists.
 * @param {number} announcementId
 * @returns {Promise<object|null>} the deleted announcement, or null if it did not exist
 */
async function deleteAnnouncement(announcementId) {
  let deleted = null;

  await withTransaction(async (client) => {
    const { rows } = await client.query(
      'DELETE FROM announcements WHERE announcement_id = $1 RETURNING announcement_id, title',
      [announcementId]
    );
    if (rows.length === 0) return;
    deleted = rows[0];

    await client.query('DELETE FROM notifications WHERE dedupe_key = $1', [
      announcementDedupeKey(announcementId),
    ]);
  });

  return deleted;
}

// ---------------------------------------------------------------------------
// Fan-out and cleanup
// ---------------------------------------------------------------------------

/**
 * Create one notification per recipient of an announcement. Safe to run twice
 * (the dedupe key skips existing ones). Never throws: failures are logged, because
 * this runs in the background after the announcement was saved.
 *
 * Recipients are active users whose role matches the audience ("all" is students,
 * faculty and admins). With a program, only that program's students and faculty.
 *
 * @param {{ announcementId: number, title: string, body: string,
 *           audience: 'all'|'students'|'faculty', programId?: number|null }} announcement
 * @returns {Promise<void>}
 */
async function fanOutAnnouncement({ announcementId, title, body, audience, programId }) {
  const params = [];
  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  let recipients = `
    SELECT u.user_id
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    LEFT JOIN students s ON s.user_id = u.user_id
    LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
    LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
    LEFT JOIN faculties f ON f.user_id = u.user_id
    WHERE u.is_active = true`;

  if (audience === 'students') {
    recipients += " AND r.role_name = 'Student'";
  } else if (audience === 'faculty') {
    recipients += " AND r.role_name = 'Faculty'";
  } else {
    recipients += " AND r.role_name IN ('Student', 'Faculty', 'ADMIN')";
  }

  if (programId) {
    const program = addParam(programId);
    recipients += ` AND (
      (r.role_name = 'Student' AND c.program_id = ${program}) OR
      (r.role_name = 'Faculty' AND f.program_id = ${program})
    )`;
  }

  const titleParam = addParam(title);
  const bodyParam = addParam(body);
  const idParam = addParam(String(announcementId));

  try {
    const { rowCount } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link, data, dedupe_key)
       SELECT
         u.user_id,
         'announcement',
         ${titleParam},
         ${bodyParam},
         '${ANNOUNCEMENT_LINK}',
         jsonb_build_object('announcementId', ${idParam}::text),
         'announcement-' || ${idParam}::text
       FROM (${recipients}) u
       ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
      params
    );
    console.log(`[Fan-out] Inserted ${rowCount} notifications for announcement ${announcementId}`);
  } catch (err) {
    console.error('[Fan-out] SQL error:', err.message);
  }
}

/** Delete notifications past the retention period. Meant to run on a schedule. */
async function cleanupOldNotifications() {
  const { rowCount } = await pool.query(
    `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '${NOTIFICATION_RETENTION_DAYS} days'`
  );
  if (rowCount > 0) {
    console.log(`[Cleanup] Deleted ${rowCount} notifications older than ${NOTIFICATION_RETENTION_DAYS} days.`);
  }
}

module.exports = {
  upsertNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getProgramIdForUser,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  fanOutAnnouncement,
  cleanupOldNotifications,
};