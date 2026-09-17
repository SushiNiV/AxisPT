  const db = require('../config/db');

class SectionModel {
  /**
   * Fetches sections for a program, optionally scoped to a specific
   * academic year + semester.
   * - yearId + semesterId given  → that exact past/future term (no is_active check)
   * - yearId given, semesterId not → every semester within that school year
   * - neither given               → current active year + current semester (original behavior)
   */
  static async getByProgramAndTerm(programId, yearId = null, semesterId = null) {
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
    // yearId given, semesterId not → no semester filter, all terms in that year returned

    const result = await db.query(`
      SELECT 
        s.section_id, s.section_name, s.program_id,
        sa.assignment_id, sa.year_level, sa.semester_id, sem.semester_label,
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
        sa.assignment_id, sa.year_level, sa.semester_id,
        sem.semester_label, ay.year_id, ay.year_label
      ORDER BY ay.year_label DESC, sa.year_level ASC, s.section_name ASC
    `, params);
    return result.rows;
  }

  // Kept for any other existing callers — same as calling with no term.
  static async getActiveByProgramId(programId) {
    return this.getByProgramAndTerm(programId);
  }

  static async getAllByProgram(programId) { /* unchanged */ }
}

module.exports = SectionModel;