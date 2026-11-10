const pool = require('../config/db'); 

// ==========================================
// NOTIFICATIONS
// ==========================================

async function upsertNotification({ userId, type, title, body, link, data = {}, dedupeKey }) {
  const query = `
    INSERT INTO notifications (user_id, type, title, body, link, data, dedupe_key)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
    DO UPDATE SET read_at = NULL
    RETURNING *;
  `;
  const values = [userId, type, title, body, link, data, dedupeKey];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getNotifications(userId, limit = 20, cursor = null) {
  let query = `
    SELECT notification_id, type, title, body, link, data, created_at, read_at
    FROM notifications
    WHERE user_id = $1
  `;
  const values = [userId];
  
  if (cursor) {
    const [createdAt, id] = cursor.split('|');
    query += ` AND (created_at, notification_id) < ($2, $3)`;
    values.push(createdAt, id);
  }

  query += ` ORDER BY created_at DESC, notification_id DESC LIMIT $${values.length + 1}`;
  values.push(limit + 1); 

  const { rows } = await pool.query(query, values);
  
  let nextCursor = null;
  if (rows.length > limit) {
    rows.pop(); 
    const last = rows[rows.length - 1];
    nextCursor = `${last.created_at.toISOString()}|${last.notification_id}`;
  }

  return { items: rows, nextCursor };
}

async function getUnreadCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::integer AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return rows[0].count;
}

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

// ==========================================
// ANNOUNCEMENTS
// ==========================================

async function createAnnouncement({ title, body, audience, programId, createdBy }) {
  const query = `
    INSERT INTO announcements (title, body, audience, program_id, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [title, body, audience, programId, createdBy];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getAnnouncements(userRole, programId) {
  const query = `
    SELECT announcement_id, title, body, audience, program_id, created_at
    FROM announcements
    WHERE archived_at IS NULL
      AND (audience = 'all' OR audience = $1)
      AND (program_id IS NULL OR program_id = $2)
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [userRole, programId]);
  return rows;
}

async function deleteAnnouncement(announcementId) {
  await pool.query('DELETE FROM announcements WHERE announcement_id = $1', [announcementId]);
}

// ==========================================
// PHASE 3: FAN-OUT & CLEANUP
// ==========================================

async function fanOutAnnouncement({ announcementId, title, body, audience, programId }) {
  let userQuery = `
    SELECT u.user_id
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    LEFT JOIN students s ON s.user_id = u.user_id
    LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
    LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
    LEFT JOIN faculties f ON f.user_id = u.user_id
    WHERE u.is_active = true
  `;

  const params = [];
  let paramCount = 1;

  // 1. Audience Filter
  if (audience === 'students') {
    userQuery += ` AND r.role_name = 'Student'`;
  } else if (audience === 'faculty') {
    userQuery += ` AND r.role_name = 'Faculty'`;
  } else {
    userQuery += ` AND r.role_name IN ('Student', 'Faculty', 'ADMIN')`;
  }

  // 2. Program Filter (Only apply if programId is passed)
  if (programId) {
    userQuery += ` AND (
      (r.role_name = 'Student' AND c.program_id = $${paramCount}) OR
      (r.role_name = 'Faculty' AND f.program_id = $${paramCount})
    )`;
    params.push(programId);
    paramCount++;
  }

  // 3. Insert into notifications using the generated query
  const insertQuery = `
    INSERT INTO notifications (user_id, type, title, body, link, data, dedupe_key)
    SELECT 
      u.user_id, 
      'announcement', 
      $${paramCount}, 
      $${paramCount + 1}, 
      '/dashboard', 
      jsonb_build_object('announcementId', $${paramCount + 2}::text), 
      'announcement-' || $${paramCount + 2}::text
    FROM (${userQuery}) u
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  `;

  params.push(title, body, announcementId);

  try {
    const result = await pool.query(insertQuery, params);
    console.log(`[Fan-out] Successfully inserted ${result.rowCount} notifications for announcement ${announcementId}`);
  } catch (err) {
    console.error('[Fan-out] SQL Error:', err.message);
  }
}

async function cleanupOldNotifications() {
  const { rowCount } = await pool.query(
    "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '45 days'"
  );
  if (rowCount > 0) {
    console.log(`[Cleanup] Deleted ${rowCount} notifications older than 45 days.`);
  }
}

module.exports = {
  upsertNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  fanOutAnnouncement,
  cleanupOldNotifications,
};