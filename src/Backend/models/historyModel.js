const db = require('../config/db');

const HistoryModel = {
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
   * Fetch audit-log rows (newest first), joined with the actor's name,
   * designation and roles, and the target user's username, for the History page.
   * @param {{limit?: number, offset?: number}} [opts]
   * @returns {Promise<Array<object>>}
   */
  async getHistoryLogs({ limit = 100, offset = 0 } = {}) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : 100;
    const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const query = `
      SELECT
        h.id,
        h.user_id,
        h.target_user_id,
        COALESCE(h.action, 'UNKNOWN') AS action,
        h.old_values,
        h.new_values,
        h.created_at,
        u.username         AS user_name,
        tu.username        AS target_user_name,
        f.first_name,
        f.last_name,
        d.designation_name,
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
      ORDER BY h.created_at DESC, h.id DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [safeLimit, safeOffset]);
    return result.rows;
  }
};

module.exports = HistoryModel;