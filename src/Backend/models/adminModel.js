const pool = require('../config/db');

const Admin = {
  findById: async (employeeID) => {
    const result = await pool.query(
      'SELECT * FROM administrators WHERE employee_id = $1', 
      [employeeID]
    );
    return result.rows[0];
  },

  logLoginAction: async (user, details) => {
    return await pool.query(
      `INSERT INTO history_transactions 
      (user_id, user_role, user_designation, action, target_id, details) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.employee_id, user.role, user.designation, 'LOGIN', user.employee_id, details]
    );
  },

  getPending: async () => {
    const result = await pool.query(
      'SELECT * FROM students WHERE account_status = false ORDER BY created_at DESC'
    );
    return result.rows;
  },

  updatePassword: async (employeeID, hashedNewPassword) => {
    return await pool.query(
      'UPDATE administrators SET password_hash = $1, must_change_password = false WHERE employee_id = $2',
      [hashedNewPassword, employeeID]
    );
  },

  logAction: async (user, actionType, details) => {
    return await pool.query(
      `INSERT INTO history_transactions 
      (user_id, user_role, user_designation, action, target_id, details) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.employee_id, user.role, user.designation, actionType, user.employee_id, details]
    );
  }
};

module.exports = Admin;