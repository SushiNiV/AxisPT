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
}
};

module.exports = HistoryModel;
