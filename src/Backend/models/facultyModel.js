const db = require('../config/db');
const { withTransaction } = require('../../utils/transaction');

// getAll / getById / getByUserId used to be three copies of this SELECT.
// Column aliases (designation_id, is_active, email) are kept: the frontend relies on them.
const FACULTY_SELECT = `
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
    (SELECT ur.role_id FROM user_roles ur
      WHERE ur.user_id = f.user_id
      ORDER BY ur.role_id LIMIT 1) AS role_id
  FROM faculties f
  LEFT JOIN designations d ON f.designation = d.designation_id
  LEFT JOIN users u ON f.user_id = u.user_id
`;

class FacultyModel {
  static async getAll(includeInactive = false) {
    const where = includeInactive ? '' : 'WHERE f.account_status = true';
    const { rows } = await db.query(`${FACULTY_SELECT} ${where} ORDER BY f.last_name ASC`);
    return rows;
  }

  static async getById(facultyId) {
    const { rows } = await db.query(`${FACULTY_SELECT} WHERE f.faculty_id = $1`, [facultyId]);
    return rows[0] || null;
  }

  static async getByUserId(userId, client = db) {
    const { rows } = await client.query(`${FACULTY_SELECT} WHERE f.user_id = $1`, [userId]);
    return rows[0] || null;
  }

  // This method did not exist before, but addFaculty called it.
  static async create(data, client = db) {
    const { user_id, last_name, first_name, middle_name, suffix, designation_id, account_status } = data;
    const { rows } = await client.query(`
      INSERT INTO faculties
        (user_id, last_name, first_name, middle_name, suffix, designation, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [user_id, last_name, first_name, middle_name ?? null, suffix ?? null, designation_id ?? null, account_status]);
    return rows[0];
  }

  /**
   * Partial update: only fields that are actually provided are written.
   * (Previously middle_name, suffix and designation were reset to NULL
   * whenever a request omitted them.)
   */
  static async updateByUserId(userId, data, client = db) {
    const sets = [];
    const values = [];
    const set = (column, value) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (data.last_name) set('last_name', data.last_name);
    if (data.first_name) set('first_name', data.first_name);
    if (data.middle_name !== undefined) set('middle_name', data.middle_name);
    if (data.suffix !== undefined) set('suffix', data.suffix);
    if (data.designation_id !== undefined) set('designation', data.designation_id);
    if (typeof data.account_status === 'boolean') set('account_status', data.account_status);

    sets.push('updated_at = NOW()');
    values.push(userId);

    const { rows } = await client.query(
      `UPDATE faculties SET ${sets.join(', ')} WHERE user_id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  /** Flips users.is_active and faculties.account_status together. Pass a client to join a transaction. */
  static async setActiveByUserId(userId, isActive, client = db) {
    await client.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE user_id = $2',
      [isActive, userId]
    );
    const { rows } = await client.query(
      'UPDATE faculties SET account_status = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [isActive, userId]
    );
    return rows[0] || null;
  }

  // Soft delete / restore. Both tables now change in ONE transaction.
  static deleteByUserId(userId) {
    return withTransaction((client) => FacultyModel.setActiveByUserId(userId, false, client));
  }

  static restoreByUserId(userId) {
    return withTransaction((client) => FacultyModel.setActiveByUserId(userId, true, client));
  }
}

module.exports = FacultyModel;