/**
 * ============================================================================
 * DocumentModel
 * ============================================================================
 * Data shaping for printable/generated documents.
 * ============================================================================
 */

const StudentManageModel = require('./studentmanageModel');
const GradeManageModel = require('./grademanageModel');
const GradingEngine = require('./gradingEngine');
const db = require('../config/db');

class DocumentModel {

  // ---------- Helper: build the document object from a context ----------
  static async _buildFromContext(studentId, context) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    const adviserName = context.adviser_first_name
      ? `${context.adviser_first_name} ${context.adviser_last_name}`.trim()
      : null;

    // Guardian info
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
    const probationStatus = standing?.status || 'None';

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
        semesterLabel: context.semester_label || 'Unknown',
        section: context.section_name || null,
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

    // Grade components
    const componentsRes = await db.query(`
      SELECT g.course_id, gc.term, gc.component_name, gc.score, g.faculty_id,
             f.last_name AS faculty_last_name, f.first_name AS faculty_first_name
      FROM grades g
      JOIN grade_components gc ON gc.grade_id = g.grade_id
      LEFT JOIN faculties f ON f.faculty_id = g.faculty_id
      WHERE g.student_id = $1 AND g.course_id = ANY($2::int[])
        AND g.year_id = $3 AND g.semester_id = $4
    `, [studentId, courseIds, context.year_id || null, context.semester_id]);

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
      semesterLabel: context.semester_label || 'Unknown',
      section: context.section_name || null,
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

  // ---------- Public: Student Form data ----------
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

  // ---------- Public: Term Grade document ----------
  static async getTermGradeData(studentId, period = null) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    // ------------------------------------------------------------
    // STEP 1: Try to find a matching student_education record
    // ------------------------------------------------------------
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

    let contextRes = await db.query(contextQuery, params);
    let context = contextRes.rows[0];

    // ------------------------------------------------------------
    // STEP 2: Fallback to most recent student_education if none found
    // ------------------------------------------------------------
    if (!context) {
      const fallbackRes = await db.query(`
        SELECT se.curriculum_id, se.year_level, se.semester_id, se.year_id,
               sem.semester_label, sec.section_name,
               f.first_name AS adviser_first_name, f.last_name AS adviser_last_name
        FROM student_education se
        LEFT JOIN semester sem ON sem.semester_id = se.semester_id
        LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
        LEFT JOIN sections sec ON sec.section_id = sa.section_id
        LEFT JOIN faculties f ON f.faculty_id = sa.adviser_id
        WHERE se.student_id = $1
        ORDER BY se.created_at DESC
        LIMIT 1
      `, [studentId]);

      if (fallbackRes.rows.length > 0) {
        context = fallbackRes.rows[0];
        // Override with requested period if provided
        if (period?.yearLevel) context.year_level = period.yearLevel;
        if (period?.semesterId) context.semester_id = period.semesterId;
        // Ensure semester_label is set
        const semRes = await db.query(`SELECT semester_label FROM semester WHERE semester_id = $1`, [context.semester_id]);
        context.semester_label = semRes.rows[0]?.semester_label || 'Unknown';
        // Ensure year_id is set (fallback to active academic year)
        if (!context.year_id) {
          const ayRes = await db.query(`SELECT year_id FROM academic_year WHERE is_active = true LIMIT 1`);
          context.year_id = ayRes.rows[0]?.year_id || null;
        }
      }
    }

    if (!context) {
      return null; // No enrollment exists for this student
    }

    // Build the document using the context
    return await this._buildFromContext(studentId, context);
  }

  // ---------- Internal: build a course outline from a curriculum id ----------
  static async _buildCourseOutline(curriculumId) {
    // 1. Get the curriculum + program header
    const headRes = await db.query(`
      SELECT 
        c.curriculum_id,
        c.version_name,
        c.start_year,
        p.program_id,
        p.program_name,
        p.program_abbr,
        p.total_year
      FROM curricula c
      JOIN programs p ON p.program_id = c.program_id
      WHERE c.curriculum_id = $1
    `, [curriculumId]);

    const head = headRes.rows[0];
    if (!head) return null;

    // 2. Get all courses in this curriculum with prerequisites as a
    //    comma-separated string of course codes.
    const coursesRes = await db.query(`
      SELECT 
        cc.year_level,
        cc.semester_id,
        s.semester_label,
        co.course_id,
        co.course_code,
        co.course_name,
        co.lec_units,
        co.lab_units,
        co.total_units,
        co.prerequisites
      FROM curriculum_courses cc
      JOIN courses co ON co.course_id = cc.course_id
      JOIN semester s ON s.semester_id = cc.semester_id
      WHERE cc.curriculum_id = $1
      ORDER BY cc.year_level ASC, cc.semester_id ASC, co.course_code ASC
    `, [curriculumId]);

    // 3. Group by year, then by semester
    const yearMap = new Map();

    for (const row of coursesRes.rows) {
      const yl = Number(row.year_level);
      const semId = Number(row.semester_id);

      if (!yearMap.has(yl)) {
        yearMap.set(yl, {
          yearLevel: yl,
          semesters: new Map(),
        });
      }

      const yearBlock = yearMap.get(yl);
      if (!yearBlock.semesters.has(semId)) {
        yearBlock.semesters.set(semId, {
          semesterId: semId,
          semesterLabel: row.semester_label,
          courses: [],
        });
      }

      yearBlock.semesters.get(semId).courses.push({
        courseId: row.course_id,
        courseCode: row.course_code,
        courseName: row.course_name,
        lecUnits: row.lec_units || 0,
        labUnits: row.lab_units || 0,
        totalUnits: row.total_units || (row.lec_units || 0) + (row.lab_units || 0),
        prerequisites: (row.prerequisites || '').trim() || 'None',
      });
    }

    // 4. Calculate totals for each semester
    const computeTotals = (courses) =>
      courses.reduce(
        (acc, c) => ({
          lec: acc.lec + (c.lecUnits || 0),
          lab: acc.lab + (c.labUnits || 0),
          total: acc.total + (c.totalUnits || 0),
        }),
        { lec: 0, lab: 0, total: 0 }
      );

    const years = Array.from(yearMap.values())
      .sort((a, b) => a.yearLevel - b.yearLevel)
      .map((yb) => {
        const sems = Array.from(yb.semesters.values())
          .sort((a, b) => a.semesterId - b.semesterId)
          .map((s) => ({
            ...s,
            totals: computeTotals(s.courses),
          }));
        return {
          yearLevel: yb.yearLevel,
          semesters: sems,
        };
      });

    // 5. Grand totals across the whole curriculum
    const allCourses = coursesRes.rows.map((r) => ({
      lecUnits: r.lec_units || 0,
      labUnits: r.lab_units || 0,
      totalUnits: r.total_units || (r.lec_units || 0) + (r.lab_units || 0),
    }));
    const grandTotals = {
      totalUnits: allCourses.reduce((s, c) => s + c.totalUnits, 0),
      totalCourses: allCourses.length,
    };

    const currentYear = new Date().getFullYear();

    return {
      curriculumId: head.curriculum_id,
      programName: head.program_name,
      programAbbr: head.program_abbr,
      versionName: head.version_name,
      startYear: head.start_year,
      effectiveYear: `${currentYear} - ${currentYear + 1}`,
      years,
      grandTotals,
    };
  }

  // ---------- Public: Course Outline document (by curriculum) ----------
  static async getCourseOutlineData(curriculumId) {
    return await this._buildCourseOutline(curriculumId);
  }

 // ---------- Public: Course Outline document (by student) ----------
  static async getCourseOutlineDataByStudent(studentId, evaluator = null) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    // Resolve the student's curriculum + enrollment context
    const ctxRes = await db.query(`
      SELECT se.curriculum_id,
            se.year_id,
            se.semester_id,
            se.year_level,
            ay.year_label AS academic_year_label
      FROM student_education se
      LEFT JOIN academic_year ay ON ay.year_id = se.year_id
      WHERE se.student_id = $1
      ORDER BY se.is_current DESC NULLS LAST, se.created_at DESC
      LIMIT 1
    `, [studentId]);

    const ctx = ctxRes.rows[0];
    if (!ctx?.curriculum_id) return null;

    const outline = await this._buildCourseOutline(ctx.curriculum_id);
    if (!outline) return null;

    // Evaluator = the logged-in user (dean / program head / faculty)
    const { facultyName } = await this._resolveEvaluator(evaluator);

    // School year: from enrollment, else active AY
    let schoolYear = ctx.academic_year_label || null;
    if (!schoolYear) {
      const ayRes = await db.query(
        `SELECT year_label FROM academic_year WHERE is_active = true LIMIT 1`
      );
      schoolYear = ayRes.rows[0]?.year_label || null;
    }

    // Per-course final grades for this student
    const gradeRes = await db.query(`
      SELECT course_id, final_grade
      FROM grades
      WHERE student_id = $1
    `, [studentId]);
    const gradeMap = new Map(gradeRes.rows.map(r => [r.course_id, r.final_grade]));

    for (const year of outline.years) {
      for (const sem of year.semesters) {
        for (const course of sem.courses) {
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

    static async _resolveEvaluator(user) {
    if (!user) return { facultyName: null };

    const facultyId = user.faculty_id || null;
    const userId = user.id || user.user_id || null;

    if (!facultyId && !userId) return { facultyName: null };

    const res = await db.query(`
      SELECT f.first_name, f.middle_name, f.last_name, f.suffix
      FROM faculties f
      WHERE f.account_status = true
        AND ( ($1::int IS NOT NULL AND f.faculty_id = $1)
          OR ($2::int IS NOT NULL AND f.user_id    = $2) )
      LIMIT 1
    `, [facultyId, userId]);

    const f = res.rows[0];
    if (!f) return { facultyName: null };

    const mi = f.middle_name ? ` ${f.middle_name.charAt(0)}.` : '';
    const sfx = f.suffix ? ` ${f.suffix}` : '';
    return { facultyName: `${f.first_name}${mi} ${f.last_name}${sfx}`.trim() };
  }
}



module.exports = DocumentModel;