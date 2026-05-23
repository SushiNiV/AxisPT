const db = require('../config/db');

class SectionAssignmentModel {
  static async createOrGetSection(sectionName, programId) {
    const result = await db.query(`
      INSERT INTO sections (section_name, program_id)
      VALUES ($1, $2)
      ON CONFLICT (section_name, program_id) DO UPDATE
      SET section_name = EXCLUDED.section_name
      RETURNING section_id
    `, [sectionName, programId]);
    return result.rows[0].section_id;
  }

  static async getLatestAssignmentBySectionId(sectionId) {
    const result = await db.query(`
      SELECT year_level, semester_id, year_id
      FROM section_assignments
      WHERE section_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [sectionId]);
    return result.rows[0];
  }

  static async createAssignment(data) {
    const { section_id, year_id, semester_id, year_level, adviser_id, is_active } = data;
    const result = await db.query(`
      INSERT INTO section_assignments (section_id, year_id, semester_id, year_level, adviser_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [section_id, year_id, semester_id, year_level, adviser_id || null, is_active]);
    return result.rows[0];
  }
}

module.exports = SectionAssignmentModel;