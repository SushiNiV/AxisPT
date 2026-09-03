/**
 * ============================================================================
 * DocumentModel
 * ============================================================================
 * Data shaping for printable/generated documents.
 * ============================================================================
 */

const StudentManageModel = require('./studentmanageModel');
const GradeManageModel = require('./gradeManageModel');
const GradingEngine = require('./gradingEngine');
const db = require('../config/db');

class DocumentModel {

  static async getStudentFormData(studentId) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    const SUPPORT_CODES = {
      'Parents': 'PARENTS',
      'Relatives': 'RELATIVES',
      'Brother or Sister': 'BROTHER/SISTER',
      'Benefactors': 'BENEFACTORS',
      'Scholarship': 'SCHOLARSHIPS'
    };

    const TRANSPO_CODES = {
      '< P50': '<P50',
      'P51-P100': 'BETWEEN P51-P100',
      '> P100': '>P100'
    };

    return {
      ...student,
      language_dialects: student.language_dialect,
      pubpriv_hs: student.pub_priv_hs,
      father_alive: student.father_status ? student.father_status.toUpperCase() : null,
      mother_alive: student.mother_status ? student.mother_status.toUpperCase() : null,
      support: student.support ? [SUPPORT_CODES[student.support] || student.support.toUpperCase()] : [],
      parents_income: student.parents_income ? student.parents_income.toUpperCase() : null,
      living_in: student.living_in ? student.living_in.toUpperCase() : null,
      daily_transpo_expense: student.daily_transpo_expense
        ? (TRANSPO_CODES[student.daily_transpo_expense] || student.daily_transpo_expense.toUpperCase())
        : null,
      ordinal_position: student.ordinal_position ? student.ordinal_position.toUpperCase() : null
    };
  }

  /**
   * Builds the data shape for TermGrade.js, accepting an optional `period`
   * object { yearLevel, semesterId } to override the current enrollment.
   */
  static async getTermGradeData(studentId, period = null) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    // Build the context query with optional period override
    let contextQuery = `
      SELECT se.curriculum_id, se.year_level, se.semester_id, se.year_id,
             sem.semester_label, sec.section_name,
             f.first_name AS adviser_first_name, f.last_name AS adviser_last_name
      FROM student_education se
      JOIN semester sem ON sem.semester_id = se.semester_id
      LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
      LEFT JOIN sections sec ON sec.section_id = sa.section_id
      LEFT JOIN faculties f ON f.faculty_id = sa.adviser_id
      WHERE se.student_id = $1
    `;
    const params = [studentId];

    if (period?.yearLevel) {
      contextQuery += ` AND se.year_level = $${params.length + 1}`;
      params.push(period.yearLevel);
    }
    if (period?.semesterId) {
      contextQuery += ` AND se.semester_id = $${params.length + 1}`;
      params.push(period.semesterId);
    }
    if (!period?.yearLevel && !period?.semesterId) {
      contextQuery += ` AND se.is_current = true`;
    }
    contextQuery += ` LIMIT 1`;

    const contextRes = await db.query(contextQuery, params);
    const context = contextRes.rows[0];
    if (!context) return null;

    const adviserName = context.adviser_first_name
      ? `${context.adviser_first_name} ${context.adviser_last_name}`.trim()
      : null;

    // Fetch guardian information (first guardian marked is_guardian = true)
    const guardianRes = await db.query(`
      SELECT first_name, middle_name, last_name, contact_no
      FROM student_family_members
      WHERE student_id = $1 AND is_guardian = true
      LIMIT 1
    `, [studentId]);
    const guardian = guardianRes.rows[0];
    const guardianName = guardian
      ? `${guardian.first_name} ${guardian.middle_name || ''} ${guardian.last_name}`.replace(/\s+/g, ' ').trim()
      : null;
    const guardianContact = guardian?.contact_no || null;

    // Academic standing
    const standingMap = await GradeManageModel.getAcademicStandingMap();
    const standing = standingMap.get(Number(studentId));
    const probationStatus = standing?.status || 'Regular';

    // Residency
    const residencyRes = await db.query(`
      SELECT residency_status, residency_year
      FROM student_status
      WHERE student_id = $1
      ORDER BY verification_date DESC NULLS LAST, status_id DESC
      LIMIT 1
    `, [studentId]);
    const residency = residencyRes.rows[0] || { residency_status: null, residency_year: null };

    // Courses for this period
    const coursesRes = await db.query(`
      SELECT co.course_id, co.course_code, co.course_name,
             co.lec_units, co.lab_units, co.grading_scheme
      FROM curriculum_courses cc
      JOIN courses co ON co.course_id = cc.course_id
      WHERE cc.curriculum_id = $1 AND cc.year_level = $2 AND cc.semester_id = $3
      ORDER BY co.course_code ASC
    `, [context.curriculum_id, context.year_level, context.semester_id]);

    if (coursesRes.rows.length === 0) {
      return {
        ...student,
        semesterLabel: context.semester_label,
        section: context.section_name,
        adviserName,
        guardianName,
        guardianContact,
        probationStatus,
        residencyStatus: residency.residency_status,
        residencyYear: residency.residency_year,
        prelimCourses: [],
        midtermCourses: [],
        finalCourses: []
      };
    }

    const courseIds = coursesRes.rows.map((c) => c.course_id);

    // Grade components for these courses for this period
    const componentsRes = await db.query(`
      SELECT g.course_id, gc.term, gc.component_name, gc.score, g.faculty_id,
             f.last_name AS faculty_last_name, f.first_name AS faculty_first_name
      FROM grades g
      JOIN grade_components gc ON gc.grade_id = g.grade_id
      LEFT JOIN faculties f ON f.faculty_id = g.faculty_id
      WHERE g.student_id = $1 AND g.course_id = ANY($2::int[])
        AND g.year_id = $3 AND g.semester_id = $4
    `, [studentId, courseIds, context.year_id, context.semester_id]);

    const scoresByCourse = new Map();
    const facultyByCourse = new Map();
    for (const row of componentsRes.rows) {
      if (!scoresByCourse.has(row.course_id)) scoresByCourse.set(row.course_id, { Prelim: {}, Midterm: {}, Final: {} });
      scoresByCourse.get(row.course_id)[row.term][row.component_name] = row.score;

      if (row.faculty_last_name) {
        facultyByCourse.set(row.course_id, `${row.faculty_first_name || ''} ${row.faculty_last_name}`.trim());
      }
    }

    const buildTermRows = (term) => coursesRes.rows.map((course) => {
      const category = GradingEngine.getCourseCategory(course);
      const scoresByTerm = scoresByCourse.get(course.course_id) || { Prelim: {}, Midterm: {}, Final: {} };
      const termScores = scoresByTerm[term] || {};
      const { average, transmuted, pointGrade } = GradingEngine.computeTermGrade(category, term, scoresByTerm);
      const cumulative = GradingEngine.computeCumulativeGrade(course, scoresByTerm);

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
        faculty: facultyByCourse.get(course.course_id) || null
      };
    });

    return {
      ...student,
      semesterLabel: context.semester_label,
      section: context.section_name,
      adviserName,
      guardianName,
      guardianContact,
      probationStatus,
      residencyStatus: residency.residency_status,
      residencyYear: residency.residency_year,
      prelimCourses: buildTermRows('Prelim'),
      midtermCourses: buildTermRows('Midterm'),
      finalCourses: buildTermRows('Final')
    };
  }
}

module.exports = DocumentModel;