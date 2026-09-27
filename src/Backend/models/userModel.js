const db = require('../config/db');

class UserModel {
  static async getAllUsers() {
    const result = await db.query(`
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
           AND r2.role_name IN ('SUPERADMIN', 'ADMIN')
         LIMIT 1) AS role_id
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN faculties f ON u.user_id = f.user_id
      LEFT JOIN designations d ON f.designation = d.designation_id
      WHERE r.role_name IN ('SUPERADMIN', 'ADMIN')
        AND f.account_status = true
      GROUP BY 
        u.user_id, u.username, u.school_email, u.is_active,
        f.first_name, f.last_name, f.middle_name, f.suffix,
        f.faculty_id, f.designation
      ORDER BY u.user_id ASC
    `);
    return result.rows;
  }

  static async getUserById(userId) {
    const result = await db.query(`
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
           AND r2.role_name IN ('SUPERADMIN', 'ADMIN')
         LIMIT 1) AS role_id
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN faculties f ON u.user_id = f.user_id
      LEFT JOIN designations d ON f.designation = d.designation_id
      WHERE u.user_id = $1
        AND r.role_name IN ('SUPERADMIN', 'ADMIN')
        AND f.account_status = true
      GROUP BY 
        u.user_id, u.username, u.school_email, u.is_active,
        f.first_name, f.last_name, f.middle_name, f.suffix,
        f.faculty_id, f.designation
    `, [userId]);
    return result.rows[0];
  }
  static async getUserById(userId) {
    const result = await db.query(`
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
        f.faculty_id
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      INNER JOIN faculties f ON u.user_id = f.user_id
      LEFT JOIN designations d ON f.designation = d.designation_id
      WHERE u.user_id = $1
        AND r.role_name IN ('SUPERADMIN', 'ADMIN')
        AND f.account_status = true
      GROUP BY u.user_id, u.username, u.school_email, u.is_active, f.first_name, f.last_name, f.middle_name, f.faculty_id
    `, [userId]);
    return result.rows[0];
  }

  static async getAllRoles() {
    const result = await db.query(`
      SELECT role_id, role_name FROM roles 
      WHERE role_name IN ('SUPERADMIN', 'ADMIN')
      ORDER BY role_name ASC
    `);
    return result.rows;
  }

  static async getAllDesignations() {
    const result = await db.query(`
      SELECT designation_id, designation_name FROM designations 
      WHERE designation_name != 'Developer'
      ORDER BY designation_name ASC
    `);
    return result.rows;
  }
}

module.exports = UserModel;