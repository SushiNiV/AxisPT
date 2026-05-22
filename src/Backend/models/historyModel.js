const db = require('../config/db');

const HistoryModel = {
  async log({ 
    userId,
    targetUserId,
    tableName,
    recordId,
    action,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null
  }) {
    const query = `
      INSERT INTO history_logs 
      (user_id, target_user_id, table_name, record_id, action, old_values, new_values, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;
    
    const values = [userId, targetUserId, tableName, recordId, action, oldValues, newValues, ipAddress, userAgent];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error("Error adding history log:", err);
      throw err;
    }
  },

  async getHistoryLogs({ limit = 100, offset = 0, userId = null, action = null }) {
    let query = `
      SELECT h.*, u.username as user_name, tu.username as target_user_name
      FROM history_logs h
      LEFT JOIN users u ON h.user_id = u.user_id
      LEFT JOIN users tu ON h.target_user_id = tu.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;
    
    if (userId) {
      query += ` AND (h.user_id = $${paramIndex} OR h.target_user_id = $${paramIndex})`;
      values.push(userId);
      paramIndex++;
    }
    
    if (action) {
      query += ` AND h.action = $${paramIndex}`;
      values.push(action);
      paramIndex++;
    }
    
    query += ` ORDER BY h.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
    
    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (err) {
      console.error("Error fetching history logs:", err);
      throw err;
    }
  }
};

module.exports = HistoryModel;