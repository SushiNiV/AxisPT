'use strict';

const db = require('../config/db');

class UserModel {
  static async getAllUsers(client = db) {
    const result = await client.query(`
      SELECT 
        u.user_id,
        u.username,
        u.school_email AS email,
        u.is_active,
        STRING_AGG(DISTINCT r.role_name, ', ') AS roles,
        STRING_AGG(DISTINCT d.designation_name, ', ') AS designations,
        f.first_name,
        f.last_name,
        f.middle_name,
        f.suffix,
        f.faculty_id,
        f.designation AS designation_id,
        (SELECT ur2.role_id
         FROM user_roles ur2
         JOIN roles r2 ON r2.role_id = ur2.role_id
         WHERE ur2.user_id = u.user_id
           AND UPPER(r2.role_name) IN ('SUPERADMIN', 'ADMIN', 'FACULTY')
         LIMIT 1) AS role_id
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN faculties f ON u.user_id = f.user_id
      LEFT JOIN designations d ON f.designation = d.designation_id
      WHERE UPPER(r.role_name) IN ('SUPERADMIN', 'ADMIN', 'FACULTY')
        AND f.account_status = true
      GROUP BY 
        u.user_id, u.username, u.school_email, u.is_active,
        f.first_name, f.last_name, f.middle_name, f.suffix,
        f.faculty_id, f.designation
      ORDER BY u.user_id ASC
    `);
    return result.rows;
  }

  static async getUserById(userId, client = db) {
    const result = await client.query(`
      SELECT 
        u.user_id,
        u.username,
        u.school_email as email,
        u.is_active,
        STRING_AGG(DISTINCT r.role_name, ', ') as roles,
        STRING_AGG(DISTINCT d.designation_name, ', ') as designations,
        f.first_name,
        f.last_name,
        f.middle_name,
        f.faculty_id,
        f.designation AS designation_id,
        (SELECT ur2.role_id
         FROM user_roles ur2
         JOIN roles r2 ON r2.role_id = ur2.role_id
         WHERE ur2.user_id = u.user_id
           AND UPPER(r2.role_name) IN ('SUPERADMIN', 'ADMIN', 'FACULTY')
         LIMIT 1) AS role_id
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN faculties f ON u.user_id = f.user_id
      LEFT JOIN designations d ON f.designation = d.designation_id
      WHERE u.user_id = $1
        AND UPPER(r.role_name) IN ('SUPERADMIN', 'ADMIN', 'FACULTY')
        AND f.account_status = true
      GROUP BY u.user_id, u.username, u.school_email, u.is_active, f.first_name, f.last_name, f.middle_name, f.faculty_id, f.designation
    `, [userId]);
    return result.rows[0];
  }

  static async getAllRoles(client = db) {
    const result = await client.query(`
      SELECT role_id, role_name FROM roles 
      WHERE UPPER(role_name) != 'STUDENT'
      ORDER BY role_name ASC
    `);
    return result.rows;
  }

  static async getAllDesignations(client = db) {
    const result = await client.query(`
      SELECT designation_id, designation_name FROM designations 
      WHERE designation_name != 'Developer'
      ORDER BY designation_name ASC
    `);
    return result.rows;
  }

  // ------------------------------------------------------------------
  // WRITE METHODS (Required for facultyController)
  // ------------------------------------------------------------------

  static async createAccount({ username, passwordHash, email, isActive = true }, client = db) {
    const { rows } = await client.query(
      `INSERT INTO users (username, password_hash, school_email, is_active, changed_pass)
       VALUES ($1, $2, $3, $4, false)
       RETURNING user_id`,
      [username, passwordHash, email, isActive]
    );
    return rows[0].user_id;
  }

  static async updateAccount(userId, { username, email, isActive }, client = db) {
    const updates = [];
    const values = [];
    
    if (username !== undefined) { values.push(username); updates.push(`username = $${values.length}`); }
    if (email !== undefined) { values.push(email); updates.push(`school_email = $${values.length}`); }
    if (isActive !== undefined) { values.push(isActive); updates.push(`is_active = $${values.length}`); }
    
    if (updates.length === 0) return;

    values.push(userId);
    await client.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${values.length}`,
      values
    );
  }

  static async setRole(userId, roleId, client = db) {
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
  }

  static async findOrCreateDesignation(name, client = db) {
    const { rows } = await client.query(
      `INSERT INTO designations (designation_name) 
       VALUES ($1) 
       ON CONFLICT (designation_name) DO UPDATE SET designation_name = EXCLUDED.designation_name 
       RETURNING designation_id`,
      [name]
    );
    return rows[0].designation_id;
  }
}

module.exports = UserModel;