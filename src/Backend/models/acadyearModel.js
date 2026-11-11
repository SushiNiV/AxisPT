'use strict';

/**
 * AcademicYearModel: data access for `academic_year`.
 *
 * Exactly one academic year should be active at a time: grade saving, student
 * creation and the dashboard all depend on it. The schema does not enforce this
 * (no unique index, and `is_active` defaults to true), so every write that can
 * change it must run in a transaction and take `lockWrites` first.
 *
 * Every method takes an optional `client` (from `withTransaction`) so it can
 * join a transaction; without one it uses the shared pool.
 */

const db = require('../config/db');

const YEAR_COLUMNS = 'year_id, year_label, is_active, current_sem, created_at, updated_at';

/** Columns that update() may touch. Used as a whitelist when building SQL. */
const UPDATABLE_COLUMNS = ['year_label', 'is_active', 'current_sem'];

/** Fixed key for the advisory lock that serialises academic-year writes. */
const WRITE_LOCK_NAME = 'academic_year.writes';

class AcademicYearModel {
  /**
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object[]>} every academic year, newest label first
   */
  static async getAll(client = db) {
    const { rows } = await client.query(
      `SELECT ${YEAR_COLUMNS} FROM academic_year ORDER BY year_label DESC`
    );
    return rows;
  }

  /**
   * @param {number} yearId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async findById(yearId, client = db) {
    const { rows } = await client.query(
      `SELECT ${YEAR_COLUMNS} FROM academic_year WHERE year_id = $1`,
      [yearId]
    );
    return rows[0] ?? null;
  }

  /**
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>} the active academic year, if any
   */
  static async getActive(client = db) {
    const { rows } = await client.query(
      `SELECT ${YEAR_COLUMNS} FROM academic_year WHERE is_active = true LIMIT 1`
    );
    return rows[0] ?? null;
  }

  /**
   * Case-insensitive lookup by label, optionally ignoring one year (so a year
   * does not collide with itself on rename).
   * @param {string} label
   * @param {{ excludeId?: number|null }} [options]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async findByLabel(label, { excludeId = null } = {}, client = db) {
    const { rows } = await client.query(
      `SELECT year_id
         FROM academic_year
        WHERE LOWER(TRIM(year_label)) = LOWER(TRIM($1))
          AND ($2::int IS NULL OR year_id <> $2::int)
        LIMIT 1`,
      [label, excludeId]
    );
    return rows[0] ?? null;
  }

  /**
   * Serialise writes to academic years until the transaction ends. Call first in
   * any create, update or activate. Requires a transaction client.
   * @param {import('pg').PoolClient} client
   */
  static async lockWrites(client) {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [WRITE_LOCK_NAME]);
  }

  /**
   * Make every year except `exceptYearId` inactive.
   * @private
   */
  static async _deactivateOthers(exceptYearId, client) {
    await client.query(
      'UPDATE academic_year SET is_active = false WHERE is_active IS NOT FALSE AND year_id <> $1',
      [exceptYearId ?? 0]
    );
  }

  /**
   * Insert a year. When it is created active, every other year is deactivated
   * (inside the caller's transaction).
   * @param {{ year_label: string, is_active?: boolean, current_sem?: number|null }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>}
   */
  static async create(data, client = db) {
    const isActive = data.is_active === true;
    if (isActive) await this._deactivateOthers(null, client);

    const { rows } = await client.query(
      `INSERT INTO academic_year (year_label, is_active, current_sem)
       VALUES ($1, $2, $3)
       RETURNING ${YEAR_COLUMNS}`,
      [data.year_label, isActive, data.current_sem ?? null]
    );
    return rows[0];
  }

  /**
   * Partial update: only keys present (not `undefined`) in `changes` are written.
   * `current_sem: null` clears the semester. Setting `is_active: true`
   * deactivates every other year.
   * @param {number} yearId
   * @param {Partial<Record<'year_label'|'is_active'|'current_sem', *>>} changes
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>} the updated row, or null if it does not exist
   */
  static async update(yearId, changes, client = db) {
    const columns = UPDATABLE_COLUMNS.filter((column) => changes[column] !== undefined);
    if (columns.length === 0) return this.findById(yearId, client);

    if (changes.is_active === true) await this._deactivateOthers(yearId, client);

    const assignments = columns.map((column, i) => `${column} = $${i + 1}`);
    const values = columns.map((column) => changes[column]);

    const { rows } = await client.query(
      `UPDATE academic_year
          SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE year_id = $${columns.length + 1}
        RETURNING ${YEAR_COLUMNS}`,
      [...values, yearId]
    );
    return rows[0] ?? null;
  }

  /**
   * Make this the only active year. Run inside a transaction: if the year does
   * not exist this returns null and the caller should roll back, so no year is
   * left inactive.
   * @param {number} yearId
   * @param {import('pg').PoolClient} client
   * @returns {Promise<object|null>}
   */
  static async setActive(yearId, client) {
    await this._deactivateOthers(yearId, client);
    const { rows } = await client.query(
      `UPDATE academic_year
          SET is_active = true, updated_at = NOW()
        WHERE year_id = $1
        RETURNING ${YEAR_COLUMNS}`,
      [yearId]
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} yearId
   * @param {number|null} currentSem  semester_id, or null to clear
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   * @throws pg error 23503 if the semester does not exist
   */
  static async updateSemester(yearId, currentSem, client = db) {
    const { rows } = await client.query(
      `UPDATE academic_year
          SET current_sem = $1, updated_at = NOW()
        WHERE year_id = $2
        RETURNING ${YEAR_COLUMNS}`,
      [currentSem, yearId]
    );
    return rows[0] ?? null;
  }
}

module.exports = AcademicYearModel;