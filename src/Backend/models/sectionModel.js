const db = require('../config/db');

class SectionModel {
  static async getActiveByProgramId(programId) {
    const result = await db.query(`
      SELECT 
        s.section_id,
        s.section_name,
        s.program_id,
        sa.year_level,
        sa.semester_id,
        sem.semester_label,
        COUNT(DISTINCT se.student_id) as student_count
      FROM sections s
      INNER JOIN section_assignments sa ON s.section_id = sa.section_id
      INNER JOIN semester sem ON sa.semester_id = sem.semester_id
      INNER JOIN academic_year ay ON sa.year_id = ay.year_id
      LEFT JOIN student_education se ON sa.assignment_id = se.assignment_id
      WHERE s.program_id = $1
        AND ay.is_active = true
        AND sa.semester_id = ay.current_sem
      GROUP BY 
        s.section_id, s.section_name, s.program_id,
        sa.year_level, sa.semester_id, sem.semester_label
      ORDER BY s.section_name ASC
    `, [programId]);
    return result.rows;
  }

  static async getAllByProgram(programId) {
    const result = await db.query(`
      SELECT 
        section_id,
        section_name,
        program_id
      FROM sections
      WHERE program_id = $1
      ORDER BY section_name ASC
    `, [programId]);
    return result.rows;
  }
}

module.exports = SectionModel;