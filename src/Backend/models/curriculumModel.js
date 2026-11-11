'use strict';

/**
 * CurriculumModel: data access for `curricula`.
 *
 * A program should have at most one active curriculum. The schema does not
 * enforce this, so writes that can change it run in a transaction and take
 * `lockProgram` first.
 *
 * Every method takes an optional `client` (from `withTransaction`) so it can
 * join a transaction; without one it uses the shared pool.
 */

const db = require('../config/db');

/** Columns that update() may touch. Used as a whitelist when building SQL. */
const UPDATABLE_COLUMNS = ['program_id', 'start_year', 'version_name', 'is_active'];

const CURRICULUM_SELECT = `
  c.curriculum_id,
  c.program_id,
  c.start_year,
  c.version_name,
  c.is_active,
  c.created_at,
  c.updated_at,
  p.program_name,
  p.program_code,
  p.program_abbr`;

class CurriculumModel {
  /**
   * Every curriculum with its program and course count.
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object[]>}
   */
  static async getAll(client = db) {
    const { rows } = await client.query(
      `SELECT ${CURRICULUM_SELECT},
              COUNT(DISTINCT cc.id) AS course_count
         FROM curricula c
         LEFT JOIN programs p ON c.program_id = p.program_id
         LEFT JOIN curriculum_courses cc ON c.curriculum_id = cc.curriculum_id
        GROUP BY
          c.curriculum_id, c.program_id, c.start_year, c.version_name,
          c.is_active, c.created_at, c.updated_at,
          p.program_name, p.program_code, p.program_abbr
        ORDER BY c.start_year DESC, p.program_name ASC`
    );
    return rows;
  }

  /**
   * @param {number} curriculumId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async getById(curriculumId, client = db) {
    const { rows } = await client.query(
      `SELECT ${CURRICULUM_SELECT}
         FROM curricula c
         LEFT JOIN programs p ON c.program_id = p.program_id
        WHERE c.curriculum_id = $1`,
      [curriculumId]
    );
    return rows[0] ?? null;
  }

  /**
   * A curriculum with the same program, start year and version name
   * (version name compared case-insensitively), optionally ignoring one.
   * @param {{ program_id: number, start_year: number, version_name: string }} key
   * @param {{ excludeId?: number|null }} [options]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async findDuplicate({ program_id, start_year, version_name }, { excludeId = null } = {}, client = db) {
    const { rows } = await client.query(
      `SELECT curriculum_id
         FROM curricula
        WHERE program_id = $1
          AND start_year = $2
          AND LOWER(TRIM(version_name)) = LOWER(TRIM($3))
          AND ($4::int IS NULL OR curriculum_id <> $4::int)
        LIMIT 1`,
      [program_id, start_year, version_name, excludeId]
    );
    return rows[0] ?? null;
  }

  /**
   * Serialise writes for one program until the transaction ends. Call first in
   * any create or update. Requires a transaction client.
   * @param {number} programId
   * @param {import('pg').PoolClient} client
   */
  static async lockProgram(programId, client) {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('curricula.program'), $1::int)",
      [programId]
    );
  }

  /** Make every other curriculum of the program inactive. @private */
  static async _deactivateOthers(programId, exceptCurriculumId, client) {
    await client.query(
      `UPDATE curricula
          SET is_active = false
        WHERE program_id = $1 AND is_active IS NOT FALSE AND curriculum_id <> $2`,
      [programId, exceptCurriculumId ?? 0]
    );
  }

  /**
   * Insert a curriculum. When created active, the program's other curricula are
   * deactivated (inside the caller's transaction).
   * @param {{ program_id: number, start_year: number, version_name: string, is_active?: boolean }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>}
   * @throws pg error 23503 if the program does not exist
   */
  static async create(data, client = db) {
    const isActive = data.is_active === true;
    if (isActive) await this._deactivateOthers(data.program_id, null, client);

    const { rows } = await client.query(
      `INSERT INTO curricula (program_id, start_year, version_name, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.program_id, data.start_year, data.version_name, isActive]
    );
    return rows[0];
  }

  /**
   * Partial update: only keys present (not `undefined`) in `changes` are written.
   * Setting `is_active: true` deactivates the program's other curricula.
   * @param {number} curriculumId
   * @param {Partial<Record<'program_id'|'start_year'|'version_name'|'is_active', *>>} changes
   * @param {{ programId: number }} context  the program the curriculum will belong to after the update
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>} the updated row, or null if it does not exist
   */
  static async update(curriculumId, changes, { programId }, client = db) {
    const columns = UPDATABLE_COLUMNS.filter((column) => changes[column] !== undefined);
    if (columns.length === 0) return this.getById(curriculumId, client);

    if (changes.is_active === true) await this._deactivateOthers(programId, curriculumId, client);

    const assignments = columns.map((column, i) => `${column} = $${i + 1}`);
    const values = columns.map((column) => changes[column]);

    const { rows } = await client.query(
      `UPDATE curricula
          SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE curriculum_id = $${columns.length + 1}
        RETURNING *`,
      [...values, curriculumId]
    );
    return rows[0] ?? null;
  }
}

module.exports = CurriculumModel;