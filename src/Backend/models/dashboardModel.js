const db = require('../config/db');

class DashboardModel {
  static async getStats() {
    // Run all the aggregate queries in parallel
    const [
      totals,
      studentsByYear,
      studentsByProgram,
      standingCounts,
      recentEnrollments,
      topCourses,
    ] = await Promise.all([
      // --- KPI totals ---
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM students WHERE account_status = true) AS active_students,
          (SELECT COUNT(*)::int FROM students) AS total_students,
          (SELECT COUNT(*)::int FROM programs WHERE program_status = true) AS active_programs,
          (SELECT COUNT(*)::int FROM courses WHERE is_active = true) AS active_courses,
          (SELECT COUNT(*)::int FROM sections) AS total_sections,
          (SELECT COUNT(*)::int FROM faculties WHERE account_status = true) AS active_faculty
      `),

      // --- Students by year level (using their current enrollment) ---
      db.query(`
        SELECT
          se.year_level::text AS year_level,
          COUNT(DISTINCT se.student_id)::int AS count
        FROM student_education se
        JOIN students s ON s.student_id = se.student_id
        WHERE se.is_current = true AND s.account_status = true
        GROUP BY se.year_level
        ORDER BY se.year_level
      `),

      // --- Students by program ---
      db.query(`
        SELECT
          p.program_abbr,
          p.program_name,
          COUNT(DISTINCT se.student_id)::int AS count
        FROM student_education se
        JOIN students s ON s.student_id = se.student_id
        JOIN curricula c ON c.curriculum_id = se.curriculum_id
        JOIN programs p ON p.program_id = c.program_id
        WHERE se.is_current = true AND s.account_status = true
        GROUP BY p.program_abbr, p.program_name
        ORDER BY count DESC
      `),

      // --- Academic standing distribution ---
      db.query(`
        SELECT
          COALESCE(ss.probation_status::text, 'None') AS status,
          COUNT(DISTINCT ss.student_id)::int AS count
        FROM student_status ss
        WHERE ss.verified_by_id IS NOT NULL
        GROUP BY ss.probation_status
      `),

      // --- Recent enrollments (last 10 students created) ---
      db.query(`
        SELECT
          u.username AS student_number,
          p.first_name,
          p.last_name,
          s.created_at,
          prog.program_abbr
        FROM students s
        JOIN users u ON u.user_id = s.user_id
        LEFT JOIN student_pii p ON p.student_id = s.student_id
        LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
        LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
        LEFT JOIN programs prog ON prog.program_id = c.program_id
        ORDER BY s.created_at DESC
        LIMIT 5
      `),

      // --- Top courses by enrollment ---
      db.query(`
        SELECT
          c.course_code,
          c.course_name,
          COUNT(g.grade_id)::int AS enrollment_count
        FROM grades g
        JOIN courses c ON c.course_id = g.course_id
        GROUP BY c.course_code, c.course_name
        ORDER BY enrollment_count DESC
        LIMIT 5
      `),
    ]);

    return {
      totals: totals.rows[0],
      studentsByYear: studentsByYear.rows,
      studentsByProgram: studentsByProgram.rows,
      standingCounts: standingCounts.rows,
      recentEnrollments: recentEnrollments.rows,
      topCourses: topCourses.rows,
    };
  }
}

module.exports = DashboardModel;