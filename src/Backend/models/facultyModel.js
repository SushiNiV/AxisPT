const db = require('../config/db');

class FacultyModel {
  static async getAll() {
    const result = await db.query(`
      SELECT 
        f.faculty_id,
        f.user_id,
        f.last_name,
        f.first_name,
        f.middle_name,
        f.suffix,
        f.designation,
        f.program_id,
        f.account_status,
        d.designation_name,
        u.username
      FROM faculties f
      LEFT JOIN designations d ON f.designation = d.designation_id
      LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.account_status = true
      ORDER BY f.last_name ASC
    `);
    return result.rows;
  }
}

module.exports = FacultyModel;