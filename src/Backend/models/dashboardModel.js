const db = require('../config/db');
const GradeManageModel = require('./grademanageModel');

const ADMIN_SCOPE = { key: 'admin', programId: null };
const tally = (rows, keyFn) => {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};

class DashboardModel {
  /** @param {{key:string, programId:number|null}} scope */
  static async getStats(scope = ADMIN_SCOPE) {
    const pid = scope.programId ?? null;

    // One pass over in-scope, non-archived students (current enrollment only).
    const studentRes = await db.query(`
      SELECT DISTINCT ON (s.student_id)
        s.student_id, s.account_status,
        se.year_level::text AS year_level,
        p.program_abbr, p.program_name
      FROM students s
      LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
      LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
      LEFT JOIN programs p ON p.program_id = c.program_id
      WHERE s.archived_at IS NULL AND ($1::int IS NULL OR c.program_id = $1)
      ORDER BY s.student_id, se.education_id DESC NULLS LAST
    `, [pid]);

    const all = studentRes.rows;
    const active = all.filter((r) => r.account_status);
    const ids = active.map((r) => r.student_id);

    const [totalsRes, standingMap, topCourses, recent, remarks] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM programs WHERE program_status = true
             AND ($1::int IS NULL OR program_id = $1)) AS active_programs,
          (SELECT COUNT(*)::int FROM courses co WHERE co.is_active = true
             AND co.is_archived IS NOT TRUE
             AND ($1::int IS NULL OR co.course_id IN (
               SELECT cc.course_id FROM curriculum_courses cc
               JOIN curricula cu ON cu.curriculum_id = cc.curriculum_id
               WHERE cu.program_id = $1))) AS active_courses,
          (SELECT COUNT(*)::int FROM sections
             WHERE $1::int IS NULL OR program_id = $1) AS total_sections,
          (SELECT COUNT(*)::int FROM faculties WHERE account_status = true
             AND ($1::int IS NULL OR program_id = $1)) AS active_faculty
      `, [pid]),

      GradeManageModel.getAcademicStandingMap(), // Masterlist = source of truth

      db.query(`
        SELECT c.course_code, c.course_name, COUNT(g.grade_id)::int AS enrollment_count
        FROM grades g JOIN courses c ON c.course_id = g.course_id
        WHERE g.archived_at IS NULL AND g.student_id = ANY($1::int[])
        GROUP BY c.course_code, c.course_name
        ORDER BY enrollment_count DESC LIMIT 5
      `, [ids]),

      db.query(`
        SELECT u.username AS student_number, p.first_name, p.last_name,
               s.created_at, prog.program_abbr
        FROM students s
        JOIN users u ON u.user_id = s.user_id
        LEFT JOIN student_pii p ON p.student_id = s.student_id
        LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
        LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
        LEFT JOIN programs prog ON prog.program_id = c.program_id
        WHERE s.student_id = ANY($1::int[])
        ORDER BY s.created_at DESC LIMIT 5
      `, [ids]),

      db.query(`
        SELECT remarks::text AS remarks, COUNT(*)::int AS count
        FROM grades
        WHERE archived_at IS NULL AND remarks IS NOT NULL AND student_id = ANY($1::int[])
        GROUP BY remarks
      `, [ids]),
    ]);

    const studentsByYear = [...tally(active, (r) => r.year_level)]
      .map(([year_level, count]) => ({ year_level, count }))
      .sort((a, b) => a.year_level.localeCompare(b.year_level));

    const progKey = (r) => (r.program_abbr ? `${r.program_abbr}||${r.program_name}` : null);
    const studentsByProgram = [...tally(active, progKey)]
      .map(([k, count]) => {
        const [program_abbr, program_name] = k.split('||');
        return { program_abbr, program_name, count };
      })
      .sort((a, b) => b.count - a.count);

    const standingTally = tally(active, (r) => standingMap.get(r.student_id)?.status || 'None');
    const standingCounts = [...standingTally].map(([status, count]) => ({ status, count }));

    return {
      totals: {
        active_students: active.length,
        total_students: all.length,
        ...totalsRes.rows[0],
      },
      studentsByYear,
      studentsByProgram,
      standingCounts,
      recentEnrollments: recent.rows,
      topCourses: topCourses.rows,
      gradeRemarks: remarks.rows,
    };
  }
}

module.exports = DashboardModel;