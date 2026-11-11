'use strict';

/**
 * HistoryModel: the audit log (table: history_logs).
 *
 * Controllers do not call `log` directly; they use utils/audit, which fills in
 * the actor, IP address and user agent from the request.
 */

const db = require('../config/db');

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

const HistoryModel = {
  /**
   * Write one audit entry. Never throws: logging must not break the caller, so
   * a failure is logged to the console and null is returned.
   *
   * @param {{ userId?: number, targetUserId?: number, tableName?: string,
   *           recordId?: number, action?: string, oldValues?: object|null,
   *           newValues?: object|null, ipAddress?: string, userAgent?: string }} entry
   * @returns {Promise<{ id: number }|null>}
   */
  async log({
    userId = null,
    targetUserId = null,
    tableName = null,
    recordId = null,
    action = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null
  }) {
    const query = `
      INSERT INTO history_logs
      (user_id, target_user_id, table_name, record_id, action,
       old_values, new_values, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    // Sanitize IPv6-mapped IPv4 for inet columns
    let safeIp = ipAddress;
    if (typeof safeIp === 'string') {
      if (safeIp.startsWith('::ffff:')) safeIp = safeIp.slice(7);
      if (safeIp === '::1') safeIp = '127.0.0.1';
    }

    const values = [
      userId, targetUserId, tableName, recordId, action,
      oldValues, newValues, safeIp, userAgent
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (err) {
      // NEVER throw — logging must not break the caller
      console.error('HistoryModel.log failed (non-fatal):', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        action,
        userId,
        targetUserId
      });
      return null;
    }
  },

  /**
   * Audit-log rows, newest first, with the actor's name, designation and roles,
   * the target user's username, and (for student records) the student's name.
   *
   * `created_at` is stored without a time zone, in UTC (the database session
   * zone), so it is marked as UTC here and comes back as the correct instant.
   *
   * @param {{ limit?: number, offset?: number }} [options]  limit is capped at 500
   * @returns {Promise<object[]>}
   */
  async getHistoryLogs({ limit = DEFAULT_PAGE_SIZE, offset = 0 } = {}) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const { rows } = await db.query(
      `SELECT
         h.id,
         h.user_id,
         h.target_user_id,
         h.table_name,
         h.record_id,
         COALESCE(h.action, 'UNKNOWN') AS action,
         h.old_values,
         h.new_values,
         h.created_at AT TIME ZONE 'UTC' AS created_at,
         u.username         AS user_name,
         tu.username        AS target_user_name,
         f.first_name,
         f.last_name,
         d.designation_name,
         NULLIF(CONCAT_WS(' ', sp.first_name, sp.last_name), '') AS record_student_name,
         (
           SELECT ARRAY_AGG(UPPER(r.role_name))
           FROM user_roles ur
           JOIN roles r ON r.role_id = ur.role_id
           WHERE ur.user_id = h.user_id
         ) AS roles
       FROM history_logs h
       LEFT JOIN users u        ON u.user_id  = h.user_id
       LEFT JOIN users tu       ON tu.user_id = h.target_user_id
       LEFT JOIN faculties f    ON f.user_id  = h.user_id
       LEFT JOIN designations d ON d.designation_id = f.designation
       LEFT JOIN student_pii sp ON h.table_name = 'students' AND sp.student_id = h.record_id
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, safeOffset]
    );
    return rows;
  }
};

module.exports = HistoryModel;