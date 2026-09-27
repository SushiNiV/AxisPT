const db = require('../config/db');

class ProgramModel {
 static async getAll({ mode = 'active' } = {}) {
  let query = `
    SELECT 
      program_id,
      program_name,
      program_abbr,
      total_year,
      program_description,
      program_status,
      created_at,
      updated_at
    FROM programs
  `;
  if (mode === 'active') {
    query += ` WHERE program_status = true`;
  } else if (mode === 'archived') {
    query += ` WHERE program_status = false`;
  }
  query += ` ORDER BY program_name ASC`;

  const result = await db.query(query);
  return result.rows;
}

  static async create(programData) {
    const { program_name, program_abbr, total_year, program_description, program_status } = programData;
    const result = await db.query(`
      INSERT INTO programs (program_name, program_abbr, total_year, program_description, program_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [program_name, program_abbr, total_year, program_description, program_status]);
    return result.rows[0];
  }

  static async update(programId, programData) {
    const { program_name, program_abbr, total_year, program_description, program_status } = programData;
    const result = await db.query(`
      UPDATE programs 
      SET program_name = $1, 
          program_abbr = $2, 
          total_year = $3, 
          program_description = $4, 
          program_status = $5,
          updated_at = NOW()
      WHERE program_id = $6
      RETURNING *
    `, [program_name, program_abbr, total_year, program_description, program_status, programId]);
    return result.rows[0];
  }

  static async deactivate(programId) {
    const result = await db.query(`
      UPDATE programs
      SET program_status = false, updated_at = NOW()
      WHERE program_id = $1
      RETURNING *
    `, [programId]);
    return result.rows[0] || null;
  }

  static async reactivate(programId) {
    const result = await db.query(`
      UPDATE programs
      SET program_status = true, updated_at = NOW()
      WHERE program_id = $1
      RETURNING *
    `, [programId]);
    return result.rows[0] || null;
  }

  static async findById(programId) {
    const result = await db.query(`
      SELECT 
        program_id,
        program_name,
        program_abbr,
        total_year,
        program_description,
        program_status,
        created_at,
        updated_at
      FROM programs
      WHERE program_id = $1
    `, [programId]);
    return result.rows[0];
  }
}

module.exports = ProgramModel;