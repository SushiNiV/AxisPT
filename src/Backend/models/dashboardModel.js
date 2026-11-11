'use strict';

/**
 * DashboardModel: statistics for the dashboard, limited to a scope.
 *
 * A scope is { key, programId }: `programId: null` covers every program (admins);
 * otherwise only that program's students, courses, sections and faculty.
 * Archived students are never counted; "active" students are those with
 * `account_status = true`.
 */

const db = require('../config/db');
const GradeManageModel = require('./grademanageModel');

const ADMIN_SCOPE = { key: 'admin', programId: null };
const RECENT_ENROLLMENTS_LIMIT = 5;
const TOP_COURSES_LIMIT = 5;

/** Count rows by a key; rows whose key is empty are skipped. */
function tally(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

class DashboardModel {
  /**
   * @param {{ key: string, programId: number|null }} [scope]
   * @returns {Promise<{
   *   totals: object, studentsByYear: object[], studentsByProgram: object[],
   *   standingCounts: object[], recentEnrollments: object[], topCourses: object[],
   *   gradeRemarks: object[]
   * }>}
   */
  static async getStats(scope = ADMIN_SCOPE) {
    const programId = scope.programId ?? null;

    const students = await this._loadStudents(programId);
    const active = students.filter((s) => s.account_status);
    const activeIds = active.map((s) => s.student_id);

    const [totals, standingMap, topCourses, recent, remarks] = await Promise.all([
      this._loadTotals(programId),
      GradeManageModel.getAcademicStandingMap(activeIds), // same rules as the masterlist
      this._loadTopCourses(activeIds),
      this._loadRecentEnrollments(activeIds),
      this._loadGradeRemarks(activeIds),
    ]);

    const studentsByYear = [...tally(active, (s) => s.year_level)]
      .map(([year_level, count]) => ({ year_level, count }))
      .sort((a, b) => a.year_level.localeCompare(b.year_level));

    const programs = new Map();
    for (const student of active) {
      if (!student.program_abbr) continue;
      const key = `${student.program_abbr}\u0000${student.program_name}`;
      const entry = programs.get(key)
        || { program_abbr: student.program_abbr, program_name: student.program_name, count: 0 };
      entry.count += 1;
      programs.set(key, entry);
    }
    const studentsByProgram = [...programs.values()].sort((a, b) => b.count - a.count);

    const standingCounts = [
      ...tally(active, (s) => standingMap.get(s.student_id)?.status || 'None'),
    ].map(([status, count]) => ({ status, count }));

    return {
      totals: { active_students: active.length, total_students: students.length, ...totals },
      studentsByYear,
      studentsByProgram,
      standingCounts,
      recentEnrollments: recent,
      topCourses,
      gradeRemarks: remarks,
    };
  }

  /**
   * One row per non-archived student in scope, with their current year level and program.
   * @private
   */
  static async _loadStudents(programId) {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (s.student_id)
         s.student_id, s.account_status,
         se.year_level::text AS year_level,
         p.program_abbr, p.program_name
       FROM students s
       LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
       LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
       LEFT JOIN programs p ON p.program_id = c.program_id
       WHERE s.archived_at IS NULL AND ($1::int IS NULL OR c.program_id = $1)
       ORDER BY s.student_id, se.education_id DESC NULLS LAST`,
      [programId]
    );
    return rows;
  }

  /** Headline counts of programs, courses, sections and faculty. @private */
  static async _loadTotals(programId) {
    const { rows } = await db.query(
      `SELECT
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
            AND ($1::int IS NULL OR program_id = $1)) AS active_faculty`,
      [programId]
    );
    return rows[0];
  }

  /** Courses with the most grade records among these students. @private */
  static async _loadTopCourses(studentIds) {
    const { rows } = await db.query(
      `SELECT c.course_code, c.course_name, COUNT(g.grade_id)::int AS enrollment_count
         FROM grades g JOIN courses c ON c.course_id = g.course_id
        WHERE g.archived_at IS NULL AND g.student_id = ANY($1::int[])
        GROUP BY c.course_code, c.course_name
        ORDER BY enrollment_count DESC
        LIMIT ${TOP_COURSES_LIMIT}`,
      [studentIds]
    );
    return rows;
  }

  /** Most recently created students among these. @private */
  static async _loadRecentEnrollments(studentIds) {
    const { rows } = await db.query(
      `SELECT u.username AS student_number, p.first_name, p.last_name,
              s.created_at, prog.program_abbr
         FROM students s
         JOIN users u ON u.user_id = s.user_id
         LEFT JOIN student_pii p ON p.student_id = s.student_id
         LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
         LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
         LEFT JOIN programs prog ON prog.program_id = c.program_id
        WHERE s.student_id = ANY($1::int[])
        ORDER BY s.created_at DESC
        LIMIT ${RECENT_ENROLLMENTS_LIMIT}`,
      [studentIds]
    );
    return rows;
  }

  /** Count of grades per remark (P, F, INC, ...) among these students. @private */
  static async _loadGradeRemarks(studentIds) {
    const { rows } = await db.query(
      `SELECT remarks::text AS remarks, COUNT(*)::int AS count
         FROM grades
        WHERE archived_at IS NULL AND remarks IS NOT NULL AND student_id = ANY($1::int[])
        GROUP BY remarks`,
      [studentIds]
    );
    return rows;
  }
}

module.exports = DashboardModel;