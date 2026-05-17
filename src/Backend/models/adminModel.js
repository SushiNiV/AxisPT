// models/adminModel.js
const db = require('../config/db');

class AdminModel {
  static async findByUsername(username) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.username,
          u.password_hash,
          u.school_email,
          u.is_active,
          u.changed_pass,
          f.faculty_id,
          f.last_name,
          f.first_name,
          f.middle_name,
          f.suffix,
          f.designation as designation_id,
          f.program_id,
          f.account_status as faculty_status,
          d.designation_name,
          STRING_AGG(DISTINCT r.role_name, ',') as roles
        FROM users u
        INNER JOIN faculties f ON u.user_id = f.user_id
        LEFT JOIN designations d ON f.designation = d.designation_id
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.username = $1 
          AND u.is_active = true 
          AND f.account_status = true
          AND r.role_name IN ('SuperAdmin', 'Admin')
        GROUP BY u.user_id, f.faculty_id, d.designation_name
      `;
      
      const result = await db.query(query, [username]);
      
      if (result.rows.length === 0) return null;
      
      const user = result.rows[0];
      return user;
    } catch (err) {
      console.error("Error in findByUsername:", err);
      throw err;
    }
  }

  static async findById(userId) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.username,
          u.password_hash,
          u.school_email,
          u.is_active,
          u.changed_pass,
          f.faculty_id,
          f.last_name,
          f.first_name,
          f.middle_name,
          f.suffix,
          f.designation as designation_id,
          f.program_id,
          d.designation_name,
          STRING_AGG(DISTINCT r.role_name, ',') as roles
        FROM users u
        INNER JOIN faculties f ON u.user_id = f.user_id
        LEFT JOIN designations d ON f.designation = d.designation_id
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.user_id = $1 
          AND u.is_active = true 
          AND f.account_status = true
          AND r.role_name IN ('SuperAdmin', 'Admin')
        GROUP BY u.user_id, f.faculty_id, d.designation_name
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) return null;
      
      const user = result.rows[0];
      return user;
    } catch (err) {
      console.error("Error in findById:", err);
      throw err;
    }
  }

  static async updatePassword(userId, hashedPassword) {
    try {
      const query = `
        UPDATE users 
        SET password_hash = $1, changed_pass = true, updated_at = NOW()
        WHERE user_id = $2
      `;
      const result = await db.query(query, [hashedPassword, userId]);
      return result.rowCount > 0;
    } catch (err) {
      console.error("Error in updatePassword:", err);
      throw err;
    }
  }

  static async updateLastLogin(userId) {
    try {
      const query = `UPDATE users SET updated_at = NOW() WHERE user_id = $1`;
      await db.query(query, [userId]);
    } catch (err) {
      console.error("Error in updateLastLogin:", err);
    }
  }
}

module.exports = AdminModel;