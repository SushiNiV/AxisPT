const { oldPool, newPool } = require('../config/db');
const pool = newPool;

const History = {
  logTransaction: async (data) => {
    const { user_id, user_role, user_designation, action, target_id, details } = data;
    const query = `
      INSERT INTO history_logs 
      (user_id, target_user_id, table_name, record_id, action, new_values, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    return await pool.query(query, [
      user_id, 
      target_id,                    // target_user_id
      user_designation || 'users',  // table_name
      target_id,                    // record_id
      action,
      JSON.stringify({ details, user_role, user_designation })
    ]);
  },

  getHistory: async (viewerId, isPowerUser) => {
    if (isPowerUser) {
      const result = await pool.query(
        'SELECT * FROM history_logs ORDER BY created_at DESC'
      );
      return result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM history_logs WHERE user_id = $1 ORDER BY created_at DESC',
        [viewerId]
      );
      return result.rows;
    }
  }
};

module.exports = History;