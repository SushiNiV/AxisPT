const pool = require('../config/db');

console.log("--- DEBUG: adminModel.js is loading ---");
console.log("--- DEBUG: pool object is:", typeof pool);

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
      'INSERT INTO history_transactions (user_id, user_role, user_designation, action, target_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.employee_id, user.role, user.designation, 'LOGIN', user.employee_id, details]
    );
  },

  getPending: async () => {
    const result = await pool.query(`
      SELECT 
        s.student_id,
        s.account_status,
        s.created_at,
        pii.firstname,
        pii.lastname,
        pii.middlename,
        pii.email,
        pii.mobile_no,
        edu.program,
        edu.year_level,
        edu.section,
        edu.classification
      FROM students s
      LEFT JOIN student_pii pii ON s.student_id = pii.student_id
      LEFT JOIN student_education edu ON s.student_id = edu.student_id
      WHERE s.account_status = false 
      ORDER BY s.created_at DESC
    `);
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
      'INSERT INTO history_transactions (user_id, user_role, user_designation, action, target_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.employee_id, user.role, user.designation, actionType, user.employee_id, details]
    );
  }
};

module.exports = Admin;