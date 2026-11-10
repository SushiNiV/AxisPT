'use strict';

const db = require('../config/db');

/** Columns returned to callers. Keep in sync with the frontend's expectations. */
const PROGRAM_COLUMNS = `
  program_id,
  program_name,
  program_abbr,
  total_year,
  program_description,
  program_status,
  created_at,
  updated_at
`;

/** Columns that update() may touch. Used as a whitelist when building SQL. */
const UPDATABLE_COLUMNS = [
  'program_name',
  'program_abbr',
  'total_year',
  'program_description',
  'program_status',
];

/** Arbitrary but fixed key for the advisory lock that guards abbreviation checks. */
const ABBR_LOCK_NAME = 'programs.program_abbr';

class ProgramModel {
  /**
   * List programs ordered by name.
   * @param {{ mode?: 'active'|'archived'|'all' }} [options]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object[]>}
   */
  static async getAll({ mode = 'active' } = {}, client = db) {
    const filters = {
      active: 'WHERE program_status = true',
      archived: 'WHERE program_status = false',
      all: '',
    };
    const where = filters[mode] ?? filters.active;

    const { rows } = await client.query(
      `SELECT ${PROGRAM_COLUMNS} FROM programs ${where} ORDER BY program_name ASC`
    );
    return rows;
  }

  /**
   * @param {number} programId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async findById(programId, client = db) {
    const { rows } = await client.query(
      `SELECT ${PROGRAM_COLUMNS} FROM programs WHERE program_id = $1`,
      [programId]
    );
    return rows[0] ?? null;
  }

  /**
   * Case-insensitive lookup by abbreviation, optionally ignoring one program
   * (used on update so a program does not collide with itself).
   * @param {string} abbr
   * @param {{ excludeId?: number|null }} [options]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async findByAbbreviation(abbr, { excludeId = null } = {}, client = db) {
    const { rows } = await client.query(
      `SELECT program_id
         FROM programs
        WHERE LOWER(program_abbr) = LOWER($1)
          AND ($2::int IS NULL OR program_id <> $2::int)
        LIMIT 1`,
      [abbr, excludeId]
    );
    return rows[0] ?? null;
  }

  /**
   * Serialise abbreviation check-then-write sequences. The schema has no unique
   * constraint on `program_abbr`, so without this two concurrent requests could
   * both pass the duplicate check. The lock lasts until the transaction ends,
   * so this must be called with a transaction client.
   * @param {import('pg').PoolClient} client
   */
  static async lockAbbreviations(client) {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [ABBR_LOCK_NAME]);
  }

  /**
   * @param {{ program_name: string, program_abbr: string, total_year: number,
   *           program_description?: string|null, program_status?: boolean }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>} the created row
   */
  static async create(data, client = db) {
    const { rows } = await client.query(
      `INSERT INTO programs
         (program_name, program_abbr, total_year, program_description, program_status)
       VALUES ($1, $2, $3, $4, COALESCE($5, true))
       RETURNING ${PROGRAM_COLUMNS}`,
      [
        data.program_name,
        data.program_abbr,
        data.total_year,
        data.program_description ?? null,
        data.program_status ?? null,
      ]
    );
    return rows[0];
  }

  /**
   * Partial update: only keys present (not `undefined`) in `changes` are written.
   * `null` is written as NULL, so a description can be cleared deliberately.
   * @param {number} programId
   * @param {Partial<Record<'program_name'|'program_abbr'|'total_year'|'program_description'|'program_status', *>>} changes
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>} the updated row, or null if it does not exist
   */
  static async update(programId, changes, client = db) {
    const columns = UPDATABLE_COLUMNS.filter((column) => changes[column] !== undefined);
    if (columns.length === 0) return this.findById(programId, client);

    const assignments = columns.map((column, i) => `${column} = $${i + 1}`);
    const values = columns.map((column) => changes[column]);

    const { rows } = await client.query(
      `UPDATE programs
          SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE program_id = $${columns.length + 1}
        RETURNING ${PROGRAM_COLUMNS}`,
      [...values, programId]
    );
    return rows[0] ?? null;
  }

  /**
   * Archive (active = false) or restore (active = true) a program.
   * Programs are never hard-deleted: sections, curricula, faculties,
   * announcements and kb_documents all reference them.
   * @param {number} programId
   * @param {boolean} active
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async setStatus(programId, active, client = db) {
    const { rows } = await client.query(
      `UPDATE programs
          SET program_status = $1, updated_at = NOW()
        WHERE program_id = $2
        RETURNING ${PROGRAM_COLUMNS}`,
      [active, programId]
    );
    return rows[0] ?? null;
  }
}

module.exports = ProgramModel;