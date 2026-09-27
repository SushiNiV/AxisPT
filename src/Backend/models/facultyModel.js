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
        f.designation AS designation_id,
        f.program_id,
        f.account_status,
        f.account_status AS is_active,
        d.designation_name,
        u.username,
        u.school_email AS email,
        (SELECT role_id FROM user_roles WHERE user_id = f.user_id LIMIT 1) AS role_id
      FROM faculties f
      LEFT JOIN designations d ON f.designation = d.designation_id
      LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.account_status = true
      ORDER BY f.last_name ASC
    `);
    return result.rows;
  }

  static async getById(facultyId) {
    const result = await db.query(`
      SELECT 
        f.faculty_id,
        f.user_id,
        f.last_name,
        f.first_name,
        f.middle_name,
        f.suffix,
        f.designation,
        f.designation AS designation_id,
        f.program_id,
        f.account_status,
        f.account_status AS is_active,
        d.designation_name,
        u.username,
        u.school_email AS email,
        (SELECT role_id FROM user_roles WHERE user_id = f.user_id LIMIT 1) AS role_id
      FROM faculties f
      LEFT JOIN designations d ON f.designation = d.designation_id
      LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.faculty_id = $1
    `, [facultyId]);
    return result.rows[0] || null;
  }

  static async getByUserId(userId) {
    const result = await db.query(`
      SELECT 
        f.faculty_id,
        f.user_id,
        f.last_name,
        f.first_name,
        f.middle_name,
        f.suffix,
        f.designation,
        f.designation AS designation_id,
        f.program_id,
        f.account_status,
        f.account_status AS is_active,
        d.designation_name,
        u.username,
        u.school_email AS email,
        (SELECT role_id FROM user_roles WHERE user_id = f.user_id LIMIT 1) AS role_id
      FROM faculties f
      LEFT JOIN designations d ON f.designation = d.designation_id
      LEFT JOIN users u ON f.user_id = u.user_id
      WHERE f.user_id = $1
    `, [userId]);
    return result.rows[0] || null;
  }

  static async updateByUserId(userId, data) {
    const {
      last_name,
      first_name,
      middle_name,
      suffix,
      designation_id,
      account_status,
    } = data;

    const result = await db.query(`
      UPDATE faculties
      SET
        last_name      = COALESCE($1, last_name),
        first_name     = COALESCE($2, first_name),
        middle_name    = $3,
        suffix         = $4,
        designation    = $5,
        account_status = COALESCE($6, account_status),
        updated_at     = NOW()
      WHERE user_id = $7
      RETURNING *
    `, [
      last_name || null,
      first_name || null,
      middle_name ?? null,
      suffix ?? null,
      designation_id ?? null,
      typeof account_status === 'boolean' ? account_status : null,
      userId,
    ]);

    return result.rows[0] || null;
  }
}

module.exports = FacultyModel;