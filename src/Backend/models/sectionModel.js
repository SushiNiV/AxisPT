'use strict';

const db = require('../config/db');

/** Columns that updateAssignment() may touch. Used as a whitelist when building SQL. */
const UPDATABLE_ASSIGNMENT_COLUMNS = [
  'year_id',
  'semester_id',
  'year_level',
  'adviser_id',
  'is_active',
];

class SectionModel {
  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Sections of a program with their assignment, term and student count.
   *
   * Without `yearId` the active academic year and its current semester are used.
   * Archived assignments are excluded unless `includeArchived` is true.
   *
   * @param {number} programId
   * @param {number|null} [yearId]
   * @param {number|null} [semesterId]
   * @param {string|null} [yearLevel]
   * @param {boolean} [includeArchived=false]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object[]>}
   */
  static async getByProgramAndTerm(
    programId,
    yearId = null,
    semesterId = null,
    yearLevel = null,
    includeArchived = false,
    client = db
  ) {
    const conditions = ['s.program_id = $1'];
    const params = [programId];

    if (yearId) {
      params.push(yearId);
      conditions.push(`ay.year_id = $${params.length}`);
    } else {
      conditions.push('ay.is_active = true');
    }

    if (semesterId) {
      params.push(semesterId);
      conditions.push(`sa.semester_id = $${params.length}`);
    } else if (!yearId) {
      conditions.push('sa.semester_id = ay.current_sem');
    }

    if (yearLevel) {
      params.push(String(yearLevel));
      conditions.push(`sa.year_level::text = $${params.length}`);
    }

    if (!includeArchived) {
      conditions.push('sa.is_active = true');
    }

    const { rows } = await client.query(
      `SELECT
         s.section_id, s.section_name, s.program_id,
         sa.assignment_id, sa.year_level, sa.semester_id, sem.semester_label,
         sa.is_active,
         ay.year_id, ay.year_label,
         COUNT(DISTINCT se.student_id)::int AS student_count
       FROM sections s
       INNER JOIN section_assignments sa ON s.section_id = sa.section_id
       INNER JOIN semester sem ON sa.semester_id = sem.semester_id
       INNER JOIN academic_year ay ON sa.year_id = ay.year_id
       LEFT JOIN student_education se ON sa.assignment_id = se.assignment_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY
         s.section_id, s.section_name, s.program_id,
         sa.assignment_id, sa.year_level, sa.semester_id, sa.is_active,
         sem.semester_label, ay.year_id, ay.year_label
       ORDER BY ay.year_label DESC, sa.year_level ASC, sa.semester_id ASC, s.section_name ASC`,
      params
    );
    return rows;
  }

  /**
   * Every archived assignment across all programs.
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object[]>}
   */
  static async getAllArchived(client = db) {
    const { rows } = await client.query(
      `SELECT
         s.section_id, s.section_name,
         p.program_id, p.program_abbr, p.program_name,
         sa.assignment_id, sa.year_level, sa.semester_id, sem.semester_label,
         sa.is_active,
         ay.year_id, ay.year_label,
         COUNT(DISTINCT se.student_id)::int AS student_count
       FROM sections s
       INNER JOIN section_assignments sa ON s.section_id = sa.section_id
       INNER JOIN semester sem ON sa.semester_id = sem.semester_id
       INNER JOIN academic_year ay ON sa.year_id = ay.year_id
       INNER JOIN programs p ON s.program_id = p.program_id
       LEFT JOIN student_education se ON sa.assignment_id = se.assignment_id
       WHERE sa.is_active = false
       GROUP BY
         s.section_id, s.section_name,
         p.program_id, p.program_abbr, p.program_name,
         sa.assignment_id, sa.year_level, sa.semester_id, sa.is_active,
         sem.semester_label, ay.year_id, ay.year_label
       ORDER BY p.program_abbr ASC, sa.year_level ASC, sa.semester_id ASC, s.section_name ASC`
    );
    return rows;
  }

  /**
   * @param {number} assignmentId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async getById(assignmentId, client = db) {
    const { rows } = await client.query(
      'SELECT * FROM section_assignments WHERE assignment_id = $1',
      [assignmentId]
    );
    return rows[0] ?? null;
  }

  /**
   * The most recently created assignment of a section, used to carry its term
   * over when the section is assigned again.
   * @param {number} sectionId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<{ year_level: string, semester_id: number, year_id: number }|null>}
   */
  static async getLatestAssignmentBySectionId(sectionId, client = db) {
    const { rows } = await client.query(
      `SELECT year_level, semester_id, year_id
         FROM section_assignments
        WHERE section_id = $1
        ORDER BY created_at DESC, assignment_id DESC
        LIMIT 1`,
      [sectionId]
    );
    return rows[0] ?? null;
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  /**
   * Insert a section, or return the existing one with the same name in the program.
   * @param {string} sectionName
   * @param {number} programId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<number>} section_id
   */
  static async createOrGetSection(sectionName, programId, client = db) {
    const { rows } = await client.query(
      `INSERT INTO sections (section_name, program_id)
       VALUES ($1, $2)
       ON CONFLICT (section_name, program_id)
       DO UPDATE SET section_name = EXCLUDED.section_name
       RETURNING section_id`,
      [sectionName, programId]
    );
    return rows[0].section_id;
  }

  /**
   * @param {{ section_id: number, year_id: number, semester_id: number,
   *           year_level: string, adviser_id?: number|null, is_active?: boolean }} data
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>} the created row
   * @throws pg error 23505 if the section already has an assignment for that year and semester
   */
  static async createAssignment(data, client = db) {
    const { rows } = await client.query(
      `INSERT INTO section_assignments
         (section_id, year_id, semester_id, year_level, adviser_id, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
       RETURNING *`,
      [
        data.section_id,
        data.year_id,
        data.semester_id,
        String(data.year_level),
        data.adviser_id ?? null,
        data.is_active ?? null,
      ]
    );
    return rows[0];
  }

  /**
   * Partial update: only keys present (not `undefined`) in `changes` are written.
   * `null` is written as NULL, so an adviser can be cleared deliberately.
   * @param {number} assignmentId
   * @param {Partial<Record<'year_id'|'semester_id'|'year_level'|'adviser_id'|'is_active', *>>} changes
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>} the updated row, or null if it does not exist
   */
  static async updateAssignment(assignmentId, changes, client = db) {
    const columns = UPDATABLE_ASSIGNMENT_COLUMNS.filter((column) => changes[column] !== undefined);
    if (columns.length === 0) return this.getById(assignmentId, client);

    const assignments = columns.map((column, i) => `${column} = $${i + 1}`);
    const values = columns.map((column) => changes[column]);

    const { rows } = await client.query(
      `UPDATE section_assignments
          SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE assignment_id = $${columns.length + 1}
        RETURNING *`,
      [...values, assignmentId]
    );
    return rows[0] ?? null;
  }

  /**
   * Archive (active = false) or restore (active = true) an assignment.
   * @param {number} assignmentId
   * @param {boolean} active
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  static async setAssignmentActive(assignmentId, active, client = db) {
    const { rows } = await client.query(
      `UPDATE section_assignments
          SET is_active = $1, updated_at = NOW()
        WHERE assignment_id = $2
        RETURNING *`,
      [active, assignmentId]
    );
    return rows[0] ?? null;
  }
}

module.exports = SectionModel;