const pool = require('../config/db');

const History = {
  logTransaction: async (data) => {
    const { user_id, user_role, user_designation, action, target_id, details } = data;
    const query = `
      INSERT INTO history_transactions 
      (user_id, user_role, user_designation, action, target_id, details, timestamp) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    return await pool.query(query, [user_id, user_role, user_designation, action, target_id, details]);
  },

  getHistory: async (viewerId, isPowerUser) => {
    if (isPowerUser) {
      const result = await pool.query('SELECT * FROM history_transactions ORDER BY timestamp DESC');
      return result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM history_transactions WHERE user_id = $1 ORDER BY timestamp DESC',
        [viewerId]
      );
      return result.rows;
    }
  }
};

module.exports = History;