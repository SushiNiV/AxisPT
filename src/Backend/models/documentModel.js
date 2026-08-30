/**
 * ============================================================================
 * DocumentModel
 * ============================================================================
 * Data shaping for printable/generated documents. This intentionally does
 * NOT duplicate any data-access queries — it reuses the other models
 * (StudentManageModel, GradeManageModel, etc.) as the single source of
 * truth for actual data, and only handles the adapter step: reshaping that
 * data into whatever flat field names and value formats a given printable
 * template expects.
 *
 * Keeping this separate from StudentManageModel matters because the two
 * have different callers with different needs: the edit modal (AddStudent)
 * wants a clean, generically-named record; a printable document wants
 * specific field names and normalized values matching its own markup
 * (e.g. uppercase checkbox comparisons). Mixing the two inside
 * StudentManageModel would make getById() increasingly fragile every time
 * a new document template needs another quirk.
 * ============================================================================
 */

const StudentManageModel = require('./studentmanageModel');
const GradingEngine = require('./gradingEngine');
const db = require('../config/db');

class DocumentModel {

  /**
   * Builds the exact flat, uppercase-normalized data shape the printable
   * StudentForm document (StudentForm.js) expects, reusing
   * StudentManageModel.getById() as the source of truth.
   *
   * @param {number} studentId
   * @returns {Promise<object|null>}
   */
  static async getStudentFormData(studentId) {
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    // AddStudent.js stores these as single Title Case selections; the
    // printable form's checkboxes compare against fixed uppercase strings
    // (and in one case, different wording), so they need translating here
    // rather than in the template itself.
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

      // Renames: StudentManageModel.getById() and the printable form
      // disagree on these names.
      language_dialects: student.language_dialect,
      pubpriv_hs: student.pub_priv_hs,
      father_alive: student.father_status ? student.father_status.toUpperCase() : null,
      mother_alive: student.mother_status ? student.mother_status.toUpperCase() : null,

      // Value normalization for the form's checkbox comparisons.
      support: student.support ? [SUPPORT_CODES[student.support] || student.support.toUpperCase()] : [],
      parents_income: student.parents_income ? student.parents_income.toUpperCase() : null,
      living_in: student.living_in ? student.living_in.toUpperCase() : null,
      daily_transpo_expense: student.daily_transpo_expense
        ? (TRANSPO_CODES[student.daily_transpo_expense] || student.daily_transpo_expense.toUpperCase())
        : null,
      ordinal_position: student.ordinal_position ? student.ordinal_position.toUpperCase() : null

      // Note: guardian_relation (e.g. "Aunt") still has nowhere to come
      // from - student_family_members.relation_type is a fixed enum, not
      // a free-text relationship field. Add a relationship_to_student
      // column via migration if this needs to be captured.
    };
  }

  /**
   * Builds the data shape TermGrade.js expects: the student's current
   * semester's courses, each with a period-local grade per term table
   * plus the single cumulative course grade, via GradingEngine.
   *
   * NOTE: TermGrade.js's own field bindings still have leftover
   * copy-paste bugs (e.g. every probation checkbox reads the same
   * data?.fatherLiving field, Year Level & Section reads data?.name) -
   * this method returns clean, correctly-named data, but the template
   * itself needs a matching cleanup pass to actually consume it.
   *
   * @param {number} studentId
   * @returns {Promise<object|null>}
   */
  static async getTermGradeData(studentId) {
    // Reuse getById() for header info (name, student number, email,
    // program, year level, section, guardian) rather than re-querying it.
    const student = await StudentManageModel.getById(studentId);
    if (!student) return null;

    // The student's current enrollment period determines which courses
    // belong on this document: their curriculum's courses for their
    // current year_level + semester_id.
    const contextRes = await db.query(`
      SELECT se.curriculum_id, se.year_level, se.semester_id, se.year_id,
             sem.semester_label
      FROM student_education se
      JOIN semester sem ON sem.semester_id = se.semester_id
      WHERE se.student_id = $1 AND se.is_current = true
      LIMIT 1
    `, [studentId]);

    const context = contextRes.rows[0];
    if (!context) return null;

    // This semester's required courses, including grading_scheme so
    // GradingEngine can determine each course's category.
    const coursesRes = await db.query(`
      SELECT co.course_id, co.course_code, co.course_name,
             co.lec_units, co.lab_units, co.grading_scheme
      FROM curriculum_courses cc
      JOIN courses co ON co.course_id = cc.course_id
      WHERE cc.curriculum_id = $1 AND cc.year_level = $2 AND cc.semester_id = $3
      ORDER BY co.course_code ASC
    `, [context.curriculum_id, context.year_level, context.semester_id]);

    if (coursesRes.rows.length === 0) {
      return { ...student, semesterLabel: context.semester_label, prelimCourses: [], midtermCourses: [], finalCourses: [] };
    }

    const courseIds = coursesRes.rows.map((c) => c.course_id);

    // All grade_components for these courses, this student, this term -
    // grouped below into { course_id: { term: { component_name: score } } }.
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

    // Build one row per course per term table, plus the cumulative grade.
    const buildTermRows = (term) => coursesRes.rows.map((course) => {
      const category = GradingEngine.getCourseCategory(course);
      const scoresByTerm = scoresByCourse.get(course.course_id) || { Prelim: {}, Midterm: {}, Final: {} };
      const termScores = scoresByTerm[term] || {};
      const { average, transmuted, pointGrade } = GradingEngine.computeTermGrade(category, term, scoresByTerm);
      const { finalGrade, remarks } = GradingEngine.computeCumulativeGrade(course, scoresByTerm);

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
        pointGrade,
        // The cumulative course grade is only meaningful once complete -
        // shown here per-course so the Final table can display the true
        // official grade (remarks is 'INC' until every component is in).
        finalGrade,
        remarks,
        faculty: facultyByCourse.get(course.course_id) || null
      };
    });

    return {
      ...student,
      semesterLabel: context.semester_label,
      prelimCourses: buildTermRows('Prelim'),
      midtermCourses: buildTermRows('Midterm'),
      finalCourses: buildTermRows('Final')
    };
  }
}

module.exports = DocumentModel;