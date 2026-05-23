const db = require('../config/db');

class CurriculumModel {
  static async getAll() {
    const result = await db.query(`
      SELECT 
        c.curriculum_id,
        c.program_id,
        c.start_year,
        c.version_name,
        c.is_active,
        c.created_at,
        c.updated_at,
        p.program_name,
        p.program_code,
        p.program_abbr,
        COUNT(DISTINCT cc.id) as course_count
      FROM curricula c
      LEFT JOIN programs p ON c.program_id = p.program_id
      LEFT JOIN curriculum_courses cc ON c.curriculum_id = cc.curriculum_id
      GROUP BY 
        c.curriculum_id, c.program_id, c.start_year, c.version_name, 
        c.is_active, c.created_at, c.updated_at,
        p.program_name, p.program_code, p.program_abbr
      ORDER BY c.start_year DESC, p.program_name ASC
    `);
    return result.rows;
  }

  static async getById(curriculumId) {
    const result = await db.query(`
      SELECT 
        c.curriculum_id,
        c.program_id,
        c.start_year,
        c.version_name,
        c.is_active,
        c.created_at,
        c.updated_at,
        p.program_name,
        p.program_code,
        p.program_abbr
      FROM curricula c
      LEFT JOIN programs p ON c.program_id = p.program_id
      WHERE c.curriculum_id = $1
    `, [curriculumId]);
    return result.rows[0];
  }

  static async create(data) {
    const { program_id, start_year, version_name, is_active } = data;
    
    if (is_active) {
      await db.query(`
        UPDATE curricula SET is_active = false 
        WHERE program_id = $1 AND curriculum_id != COALESCE($2, 0)
      `, [program_id, 0]);
    }
    
    const result = await db.query(`
      INSERT INTO curricula (program_id, start_year, version_name, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [program_id, start_year, version_name, is_active]);
    
    return result.rows[0];
  }

  static async update(curriculumId, data) {
    const { program_id, start_year, version_name, is_active } = data;
    
    if (is_active) {
      await db.query(`
        UPDATE curricula SET is_active = false 
        WHERE program_id = $1 AND curriculum_id != $2
      `, [program_id, curriculumId]);
    }
    
    const result = await db.query(`
      UPDATE curricula 
      SET program_id = $1,
          start_year = $2,
          version_name = $3,
          is_active = $4,
          updated_at = NOW()
      WHERE curriculum_id = $5
      RETURNING *
    `, [program_id, start_year, version_name, is_active, curriculumId]);
    
    return result.rows[0];
  }

  static async delete(curriculumId) {
    await db.query(`DELETE FROM curriculum_courses WHERE curriculum_id = $1`, [curriculumId]);
    const result = await db.query(`DELETE FROM curricula WHERE curriculum_id = $1`, [curriculumId]);
    return result.rowCount > 0;
  }
}

module.exports = CurriculumModel;