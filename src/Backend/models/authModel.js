const db = require('../config/db');

/**
 * Credentials and login lookups for ALL roles. Replaces AdminModel, which
 * handled student-and-staff accounts but was named for admins only.
 */

// birth_date is returned as 'YYYY-MM-DD' text so it never shifts a day through
// JS Date/timezone conversion.
const studentLoginQuery = (where) => `
  SELECT s.student_id, s.user_id,
         to_char(s.birth_date, 'YYYY-MM-DD') AS birth_date,
         s.account_status, s.archived_at,
         u.username, u.password_hash, u.is_active, u.changed_pass,
         p.first_name, p.last_name
  FROM students s
  JOIN users u ON u.user_id = s.user_id
  LEFT JOIN student_pii p ON p.student_id = s.student_id
  WHERE ${where}
  ORDER BY s.student_id
  LIMIT 1
`;

const staffLoginQuery = (where) => `
  SELECT u.user_id, u.username, u.password_hash, u.school_email,
         u.is_active, u.changed_pass,
         f.faculty_id, f.first_name, f.account_status AS faculty_status,
         d.designation_name,
         STRING_AGG(DISTINCT r.role_name, ',') AS roles
  FROM users u
  LEFT JOIN faculties f ON f.user_id = u.user_id
  LEFT JOIN designations d ON d.designation_id = f.designation
  LEFT JOIN user_roles ur ON ur.user_id = u.user_id
  LEFT JOIN roles r ON r.role_id = ur.role_id
  WHERE ${where}
  GROUP BY u.user_id, u.username, u.password_hash, u.school_email,
           u.is_active, u.changed_pass,
           f.faculty_id, f.first_name, f.account_status, d.designation_name
  ORDER BY u.user_id
  LIMIT 1
`;

const first = async (sql, params) => {
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
};

class AuthModel {
  static findStudentByUsername(username) {
    return first(studentLoginQuery('u.username = $1'), [username]);
  }

  /** `email` must already be lowercased. */
  static findStudentByEmail(email) {
    return first(studentLoginQuery('LOWER(u.school_email) = $1'), [email]);
  }

  static findStaffByUsername(username) {
    return first(staffLoginQuery('u.username = $1'), [username]);
  }

  /** `email` must already be lowercased. */
  static findStaffByEmail(email) {
    return first(staffLoginQuery('LOWER(u.school_email) = $1'), [email]);
  }

  static findCredentialsById(userId) {
    return first(
      'SELECT user_id, password_hash, changed_pass FROM users WHERE user_id = $1',
      [userId]
    );
  }

  /** User-initiated change: also clears the "must change password" flag. */
  static async updatePassword(userId, hashedPassword) {
    const { rowCount } = await db.query(
      `UPDATE users
          SET password_hash = $1, changed_pass = true, updated_at = NOW()
        WHERE user_id = $2`,
      [hashedPassword, userId]
    );
    return rowCount > 0;
  }

  /** Silent upgrade of a legacy plaintext password. Leaves changed_pass alone. */
  static async rehashPassword(userId, hashedPassword) {
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashedPassword, userId]);
  }

  // There is no last_login column, so this only bumps updated_at.
  static async touchLastLogin(userId) {
    try {
      await db.query('UPDATE users SET updated_at = NOW() WHERE user_id = $1', [userId]);
    } catch (err) {
      console.error('touchLastLogin failed:', err.message);
    }
  }

  /** Username / student number (exact, as login does) OR school email. Both are indexed. */
  static findUserForReset(identifier) {
    const raw = String(identifier).trim();
    return first(
      `SELECT user_id, username, school_email
         FROM users
        WHERE (username = $1 OR LOWER(school_email) = $2)
          AND is_active = true
        ORDER BY (username = $1) DESC, user_id
        LIMIT 1`,
      [raw, raw.toLowerCase()]
    );
  }

  /** One live token per user: a new request overwrites the previous one. */
  static async createResetToken(userId, tokenHash, minutes) {
    await db.query(
      `UPDATE users
          SET reset_token_hash = $2, reset_expires_at = NOW() + make_interval(mins => $3)
        WHERE user_id = $1`,
      [userId, tokenHash, minutes]
    );
  }

  /** Atomically clears a valid token (single-use). Returns user_id or null. */
  static async consumeResetToken(tokenHash) {
    const row = await first(
      `UPDATE users
          SET reset_token_hash = NULL, reset_expires_at = NULL
        WHERE reset_token_hash = $1 AND reset_expires_at > NOW() AND is_active = true
        RETURNING user_id`,
      [tokenHash]
    );
    return row ? row.user_id : null;
  }

  /** Cheap check so the reset page can reject a dead link before the user types. */
  static async isResetTokenValid(tokenHash) {
    const row = await first(
      `SELECT 1 AS ok FROM users
        WHERE reset_token_hash = $1 AND reset_expires_at > NOW() AND is_active = true`,
      [tokenHash]
    );
    return Boolean(row);
  }
}

module.exports = AuthModel;