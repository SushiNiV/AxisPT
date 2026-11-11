'use strict';

/**
 * DocumentModel: assembles the data for printable documents.
 *
 *  - Student form       (getStudentFormData)
 *  - Term grade report  (getTermGradeData)
 *  - Course outline     (getCourseOutlineData, getCourseOutlineDataByStudent)
 *
 * This model only reads. Grade arithmetic lives in services/gradingEngine.js.
 */

const StudentManageModel = require('./studentmanageModel');
const GradeManageModel = require('./grademanageModel');
const GradingEngine = require('../services/gradingEngine');
const db = require('../config/db');

/** Student-form codes for the "who supports your studies" answer. */
const SUPPORT_CODES = {
  Parents: 'PARENTS',
  Relatives: 'RELATIVES',
  'Brother or Sister': 'BROTHER/SISTER',
  Benefactors: 'BENEFACTORS',
  Scholarship: 'SCHOLARSHIPS',
};

/** Student-form codes for the daily transportation expense ranges. */
const TRANSPO_CODES = {
  '< P50': '<P50',
  'P51-P100': 'BETWEEN P51-P100',
  '> P100': '>P100',
};

const upper = (value) => (value ? value.toUpperCase() : null);
const emptyScores = () => ({ Prelim: {}, Midterm: {}, Final: {} });
const unitsOf = (row) => ({
  lec: row.lec_units || 0,
  lab: row.lab_units || 0,
  total: row.total_units || (row.lec_units || 0) + (row.lab_units || 0),
});

/** Columns shared by the two enrolment-context queries. */
const CONTEXT_SELECT = `
  SELECT se.curriculum_id, se.year_level, se.semester_id, se.year_id,
         sem.semester_label, sec.section_name,
         f.first_name AS adviser_first_name, f.last_name AS adviser_last_name
    FROM student_education se
    LEFT JOIN semester sem ON sem.semester_id = se.semester_id
    LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
    LEFT JOIN sections sec ON sec.section_id = sa.section_id
    LEFT JOIN faculties f ON f.faculty_id = sa.adviser_id`;

class DocumentModel {
  // -------------------------------------------------------------------------
  // Student form
  // -------------------------------------------------------------------------

  /**
   * The student's profile with the answer codes the printed form expects.
   * @param {number} studentId
   * @returns {Promise<object|null>}
   */
  static async getStudentFormData(studentId) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    return {
      ...student,
      language_dialects: student.language_dialect,
      pubpriv_hs: student.pub_priv_hs,
      father_alive: upper(student.father_status),
      mother_alive: upper(student.mother_status),
      support: student.support ? [SUPPORT_CODES[student.support] || student.support.toUpperCase()] : [],
      parents_income: upper(student.parents_income),
      living_in: upper(student.living_in),
      daily_transpo_expense: student.daily_transpo_expense
        ? (TRANSPO_CODES[student.daily_transpo_expense] || student.daily_transpo_expense.toUpperCase())
        : null,
      ordinal_position: upper(student.ordinal_position),
    };
  }

  /**
   * student_id for a login account, or null.
   * @param {number} userId
   * @returns {Promise<number|null>}
   */
  static async findStudentIdByUserId(userId) {
    const { rows } = await db.query('SELECT student_id FROM students WHERE user_id = $1', [userId]);
    return rows[0]?.student_id ?? null;
  }

  // -------------------------------------------------------------------------
  // Term grade report
  // -------------------------------------------------------------------------

  /**
   * Term grade report for one enrolment period.
   *
   * The period is the student's current enrolment unless `yearLevel` and/or
   * `semesterId` are given. If no enrolment matches, the most recent enrolment is
   * used with the requested period applied to it. Returns null if the student has
   * no enrolment at all.
   *
   * @param {number} studentId
   * @param {{ yearLevel?: number, semesterId?: number }|null} [period]
   * @returns {Promise<object|null>}
   */
  static async getTermGradeData(studentId, period = null) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    const context = await this._findEnrolmentContext(studentId, period);
    if (!context) return null;

    return this._buildTermGradeDocument(student, context);
  }

  /**
   * @private
   * @returns {Promise<object|null>}
   */
  static async _findEnrolmentContext(studentId, period) {
    const conditions = ['se.student_id = $1', 'se.semester_id IS NOT NULL'];
    const params = [studentId];

    if (period?.yearLevel) {
      params.push(period.yearLevel);
      conditions.push(`se.year_level = $${params.length}`);
    }
    if (period?.semesterId) {
      params.push(period.semesterId);
      conditions.push(`se.semester_id = $${params.length}`);
    }
    if (!period?.yearLevel && !period?.semesterId) {
      conditions.push('se.is_current = true');
    }

    const { rows } = await db.query(
      `${CONTEXT_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY se.is_current DESC NULLS LAST, se.education_id DESC
        LIMIT 1`,
      params
    );
    if (rows[0]) return rows[0];

    // Fallback: the most recent enrolment, with the requested period applied.
    const { rows: fallback } = await db.query(
      `${CONTEXT_SELECT}
        WHERE se.student_id = $1
        ORDER BY se.created_at DESC, se.education_id DESC
        LIMIT 1`,
      [studentId]
    );
    const context = fallback[0];
    if (!context) return null;

    if (period?.yearLevel) context.year_level = period.yearLevel;
    if (period?.semesterId) context.semester_id = period.semesterId;

    const [semester, activeYear] = await Promise.all([
      db.query('SELECT semester_label FROM semester WHERE semester_id = $1', [context.semester_id]),
      context.year_id
        ? Promise.resolve(null)
        : db.query('SELECT year_id FROM academic_year WHERE is_active = true LIMIT 1'),
    ]);
    context.semester_label = semester.rows[0]?.semester_label || 'Unknown';
    if (!context.year_id) context.year_id = activeYear?.rows[0]?.year_id || null;

    return context;
  }

  /**
   * Build the term grade document: student details plus one row per curriculum
   * course for each of the Prelim, Midterm and Final tables.
   * @private
   */
  static async _buildTermGradeDocument(student, context) {
    const studentId = student.student_id;

    const [guardianRes, standingMap, residencyRes, coursesRes] = await Promise.all([
      db.query(
        `SELECT first_name, middle_name, last_name, contact_no
           FROM student_family_members
          WHERE student_id = $1 AND is_guardian = true
          LIMIT 1`,
        [studentId]
      ),
      GradeManageModel.getAcademicStandingMap([Number(studentId)]),
      db.query(
        `SELECT residency_status, residency_year
           FROM student_status
          WHERE student_id = $1
          ORDER BY verification_date DESC NULLS LAST, status_id DESC
          LIMIT 1`,
        [studentId]
      ),
      db.query(
        `SELECT co.course_id, co.course_code, co.course_name,
                co.lec_units, co.lab_units, co.grading_scheme
           FROM curriculum_courses cc
           JOIN courses co ON co.course_id = cc.course_id
          WHERE cc.curriculum_id = $1 AND cc.year_level = $2 AND cc.semester_id = $3
          ORDER BY co.course_code ASC`,
        [context.curriculum_id, context.year_level, context.semester_id]
      ),
    ]);

    const guardian = guardianRes.rows[0];
    const residency = residencyRes.rows[0] || { residency_status: null, residency_year: null };

    const header = {
      ...student,
      semesterLabel: context.semester_label || 'Unknown',
      section: context.section_name || null,
      adviserName: context.adviser_first_name
        ? `${context.adviser_first_name} ${context.adviser_last_name}`.trim()
        : null,
      guardianName: guardian
        ? `${guardian.first_name} ${guardian.middle_name || ''} ${guardian.last_name}`
          .replace(/\s+/g, ' ').trim()
        : null,
      guardianContact: guardian?.contact_no || null,
      probationStatus: standingMap.get(Number(studentId))?.status || 'None',
      residencyStatus: residency.residency_status,
      residencyYear: residency.residency_year,
    };

    const courses = coursesRes.rows;
    if (courses.length === 0) {
      return { ...header, prelimCourses: [], midtermCourses: [], finalCourses: [] };
    }

    const { scoresByCourse, facultyByCourse } = await this._loadScores(studentId, courses, context);

    // Grade maths per course, once: shared by the three term tables.
    const gradedCourses = courses.map((course) => {
      const scoresByTerm = scoresByCourse.get(course.course_id) || emptyScores();
      return {
        course,
        category: GradingEngine.getCourseCategory(course),
        scoresByTerm,
        cumulative: GradingEngine.computeCumulativeGrade(course, scoresByTerm),
      };
    });

    const buildTermRows = (term) => gradedCourses.map(({ course, category, scoresByTerm, cumulative }) => {
      const termScores = scoresByTerm[term] || {};
      const { average, transmuted, pointGrade } = GradingEngine.computeTermGrade(category, term, scoresByTerm);

      // The Final table shows the official cumulative grade; the others a snapshot.
      const isFinal = term === 'Final';
      const periodRemarks = pointGrade === null ? null : (pointGrade === 5.0 ? 'F' : 'P');

      return {
        courseCode: course.course_code,
        courseName: course.course_name,
        category,
        quizzesAverage: termScores['Quizzes/AT'] ?? null,
        examScore: termScores[`${term} Exam`] ?? null,
        examAverage: termScores[`${term} Exam`] ?? null,
        labPracticalAverage: termScores['Unit Practical Exam'] ?? null,
        oscespe: termScores[`${term} OSCE/OSPE`] ?? null,
        average,
        transmuted,
        pointGrade: isFinal ? cumulative.finalGrade : pointGrade,
        remarks: isFinal ? cumulative.remarks : periodRemarks,
        faculty: facultyByCourse.get(course.course_id) || null,
      };
    });

    return {
      ...header,
      prelimCourses: buildTermRows('Prelim'),
      midtermCourses: buildTermRows('Midterm'),
      finalCourses: buildTermRows('Final'),
    };
  }

  /**
   * Score components and grading faculty per course for the period. Archived
   * grades are ignored.
   * @private
   */
  static async _loadScores(studentId, courses, context) {
    const { rows } = await db.query(
      `SELECT g.course_id, gc.term, gc.component_name, gc.score,
              f.last_name AS faculty_last_name, f.first_name AS faculty_first_name
         FROM grades g
         JOIN grade_components gc ON gc.grade_id = g.grade_id
         LEFT JOIN faculties f ON f.faculty_id = g.faculty_id
        WHERE g.student_id = $1 AND g.course_id = ANY($2::int[])
          AND g.year_id = $3 AND g.semester_id = $4
          AND g.archived_at IS NULL`,
      [studentId, courses.map((c) => c.course_id), context.year_id || null, context.semester_id]
    );

    const scoresByCourse = new Map();
    const facultyByCourse = new Map();
    for (const row of rows) {
      if (!scoresByCourse.has(row.course_id)) scoresByCourse.set(row.course_id, emptyScores());
      scoresByCourse.get(row.course_id)[row.term][row.component_name] = row.score;

      if (row.faculty_last_name) {
        facultyByCourse.set(
          row.course_id,
          `${row.faculty_first_name || ''} ${row.faculty_last_name}`.trim()
        );
      }
    }
    return { scoresByCourse, facultyByCourse };
  }

  // -------------------------------------------------------------------------
  // Course outline
  // -------------------------------------------------------------------------

  /**
   * Course outline of a curriculum: courses grouped by year and semester, with
   * unit totals.
   * @param {number} curriculumId
   * @returns {Promise<object|null>} null if the curriculum does not exist
   */
  static async getCourseOutlineData(curriculumId) {
    return this._buildCourseOutline(curriculumId);
  }

  /**
   * Course outline for a student's curriculum, with their latest final grade per
   * course (archived grades ignored), the evaluator's name and the school year.
   *
   * @param {number} studentId
   * @param {{ id?: number, user_id?: number, faculty_id?: number }|null} [evaluator]
   *   the signed-in user, named on the document
   * @returns {Promise<object|null>} null if the student or their curriculum is missing
   */
  static async getCourseOutlineDataByStudent(studentId, evaluator = null) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    const { rows: [context] } = await db.query(
      `SELECT se.curriculum_id, se.year_id, se.semester_id, se.year_level,
              ay.year_label AS academic_year_label
         FROM student_education se
         LEFT JOIN academic_year ay ON ay.year_id = se.year_id
        WHERE se.student_id = $1
        ORDER BY se.is_current DESC NULLS LAST, se.created_at DESC
        LIMIT 1`,
      [studentId]
    );
    if (!context?.curriculum_id) return null;

    const outline = await this._buildCourseOutline(context.curriculum_id);
    if (!outline) return null;

    const [{ facultyName }, schoolYear, gradeMap] = await Promise.all([
      this._resolveEvaluator(evaluator),
      context.academic_year_label
        ? Promise.resolve(context.academic_year_label)
        : db.query('SELECT year_label FROM academic_year WHERE is_active = true LIMIT 1')
          .then((r) => r.rows[0]?.year_label || null),
      this._loadLatestFinalGrades(studentId),
    ]);

    for (const year of outline.years) {
      for (const semester of year.semesters) {
        for (const course of semester.courses) {
          course.finalGrade = gradeMap.get(course.courseId) ?? null;
        }
      }
    }

    return {
      ...outline,
      student: {
        student_id: student.student_id,
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
        middle_name: student.middle_name || null,
      },
      facultyName,
      schoolYear,
    };
  }

  /**
   * Final grade per course, latest attempt only (a failed then retaken course
   * shows the retake). Archived grades are ignored.
   * @private
   * @returns {Promise<Map<number, number|null>>}
   */
  static async _loadLatestFinalGrades(studentId) {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (course_id) course_id, final_grade
         FROM grades
        WHERE student_id = $1 AND archived_at IS NULL
        ORDER BY course_id, year_id DESC, semester_id DESC`,
      [studentId]
    );
    return new Map(rows.map((r) => [r.course_id, r.final_grade]));
  }

  /** @private */
  static async _buildCourseOutline(curriculumId) {
    const { rows: [head] } = await db.query(
      `SELECT c.curriculum_id, c.version_name, c.start_year,
              p.program_id, p.program_name, p.program_abbr, p.total_year
         FROM curricula c
         JOIN programs p ON p.program_id = c.program_id
        WHERE c.curriculum_id = $1`,
      [curriculumId]
    );
    if (!head) return null;

    const { rows } = await db.query(
      `SELECT cc.year_level, cc.semester_id, s.semester_label,
              co.course_id, co.course_code, co.course_name,
              co.lec_units, co.lab_units, co.total_units, co.prerequisites
         FROM curriculum_courses cc
         JOIN courses co ON co.course_id = cc.course_id
         JOIN semester s ON s.semester_id = cc.semester_id
        WHERE cc.curriculum_id = $1
        ORDER BY cc.year_level ASC, cc.semester_id ASC, co.course_code ASC`,
      [curriculumId]
    );

    // Group by year level, then semester. Rows arrive already ordered.
    const years = new Map();
    for (const row of rows) {
      const yearLevel = Number(row.year_level);
      const semesterId = Number(row.semester_id);
      const units = unitsOf(row);

      if (!years.has(yearLevel)) years.set(yearLevel, { yearLevel, semesters: new Map() });
      const { semesters } = years.get(yearLevel);
      if (!semesters.has(semesterId)) {
        semesters.set(semesterId, {
          semesterId,
          semesterLabel: row.semester_label,
          courses: [],
          totals: { lec: 0, lab: 0, total: 0 },
        });
      }

      const semester = semesters.get(semesterId);
      semester.courses.push({
        courseId: row.course_id,
        courseCode: row.course_code,
        courseName: row.course_name,
        lecUnits: units.lec,
        labUnits: units.lab,
        totalUnits: units.total,
        prerequisites: (row.prerequisites || '').trim() || 'None',
      });
      semester.totals.lec += units.lec;
      semester.totals.lab += units.lab;
      semester.totals.total += units.total;
    }

    const currentYear = new Date().getFullYear();

    return {
      curriculumId: head.curriculum_id,
      programName: head.program_name,
      programAbbr: head.program_abbr,
      versionName: head.version_name,
      startYear: head.start_year,
      effectiveYear: `${currentYear} - ${currentYear + 1}`,
      years: [...years.values()].map((year) => ({
        yearLevel: year.yearLevel,
        semesters: [...year.semesters.values()],
      })),
      grandTotals: {
        totalUnits: rows.reduce((sum, row) => sum + unitsOf(row).total, 0),
        totalCourses: rows.length,
      },
    };
  }

  /**
   * The signed-in user's name as it appears on a document ("First M. Last Suffix").
   * Only active faculty accounts have one.
   * @private
   * @returns {Promise<{ facultyName: string|null }>}
   */
  static async _resolveEvaluator(user) {
    const facultyId = user?.faculty_id || null;
    const userId = user?.id || user?.user_id || null;
    if (!facultyId && !userId) return { facultyName: null };

    const { rows: [f] } = await db.query(
      `SELECT f.first_name, f.middle_name, f.last_name, f.suffix
         FROM faculties f
        WHERE f.account_status = true
          AND ( ($1::int IS NOT NULL AND f.faculty_id = $1)
             OR ($2::int IS NOT NULL AND f.user_id    = $2) )
        LIMIT 1`,
      [facultyId, userId]
    );
    if (!f) return { facultyName: null };

    const middleInitial = f.middle_name ? ` ${f.middle_name.charAt(0)}.` : '';
    const suffix = f.suffix ? ` ${f.suffix}` : '';
    return { facultyName: `${f.first_name}${middleInitial} ${f.last_name}${suffix}`.trim() };
  }
}

module.exports = DocumentModel;