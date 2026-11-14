'use strict';

/**
 * GradeManageModel: data access and grade-sheet assembly for student grades.
 *
 * Scoring rules live in services/gradingEngine.js (pure, no database access).
 * This model loads data, applies the engine, and persists the result.
 *
 * Conventions:
 *  - saveGrades() owns its own transaction, so callers never see partial saves.
 *  - Business-rule failures are thrown as HttpError(400); database errors are
 *    left to the caller (the controller translates constraint violations).
 *  - Audit logging is the controller's job. Methods that change state return
 *    the facts the controller needs to log.
 *
 * Schema rules this code relies on:
 *  - UNIQUE (student_id, course_id, year_id, semester_id, year_level) on grades,
 *    so saving the same course/term again updates the row (and un-archives it).
 *  - grades.faculty_id references faculties.faculty_id (not users.user_id).
 *  - Raw and transmuted marks are CHECK-constrained to 60-100.
 *  - grade_prereq_overrides cascades on grade delete; grade_components does not.
 */

const db = require('../config/db');
const GradingEngine = require('../services/gradingEngine');
const HttpError = require('../../utils/httpError');
const { withTransaction } = require('../../utils/transaction');

const ACADEMIC_STANDING = {
  NONE: 'None',
  WARNING: 'Warning',
  PROBATIONARY_1: 'Probationary 1',
  PROBATIONARY_2: 'Probationary 2',
};

const PROBATION_STATUS_LABELS = {
  None: ACADEMIC_STANDING.NONE,
  Warning: ACADEMIC_STANDING.WARNING,
  'Probationary 1': ACADEMIC_STANDING.PROBATIONARY_1,
  'Probationary 2': ACADEMIC_STANDING.PROBATIONARY_2,
};

const TERMS = ['Prelim', 'Midterm', 'Final'];

/** Allowed range for manual raw/transmuted marks. Mirrors the grades_*_range CHECKs. */
const MARK_RANGE = { min: 60, max: 100 };

/** Allowed range for a single component score (grade_components.score is numeric(5,2)). */
const SCORE_RANGE = { min: 0, max: 100 };

const isBlank = (value) => value === '' || value === undefined || value === null;
const toNumberOrNull = (value) => (isBlank(value) ? null : Number(value));
const emptyScores = () => ({ Prelim: {}, Midterm: {}, Final: {} });

class GradeManageModel {
  // -------------------------------------------------------------------------
  // Lookups
  // -------------------------------------------------------------------------

  /**
   * The active academic year and its current semester.
   * @returns {Promise<{ year_id: number|null, semester_id: number|null }>}
   */
  static async getActiveAcademicTerm(client = db) {
    const { rows } = await client.query(
      `SELECT year_id, current_sem AS semester_id
         FROM academic_year
        WHERE is_active = true
        LIMIT 1`
    );
    return rows[0] || { year_id: null, semester_id: null };
  }

  /**
   * faculties.faculty_id for a login account, or null (e.g. admins have none).
   * grades.faculty_id references faculty_id, so a user_id must never be stored there.
   * @param {number} userId
   * @returns {Promise<number|null>}
   */
  static async findFacultyIdByUserId(userId, client = db) {
    const { rows } = await client.query(
      'SELECT faculty_id FROM faculties WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return rows[0]?.faculty_id ?? null;
  }

  /**
   * The student's current curriculum, year level and program.
   * @returns {Promise<object|null>}
   */
  static async getStudentCurriculumContext(studentId, client = db) {
    const { rows } = await client.query(
      `SELECT
         se.curriculum_id,
         se.year_level AS current_year_level,
         se.year_id AS current_year_id,
         c.program_id,
         p.program_name,
         p.program_abbr,
         p.total_year
       FROM student_education se
       JOIN curricula c ON c.curriculum_id = se.curriculum_id
       JOIN programs p ON p.program_id = c.program_id
       WHERE se.student_id = $1
       ORDER BY se.is_current DESC NULLS LAST, se.education_id DESC
       LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  }

  /**
   * Map of course_id -> earliest curriculum year level, for the student's curriculum.
   * @returns {Promise<Map<number, number>>}
   */
  static async getCurriculumYearLevelMap(studentId) {
    const context = await this.getStudentCurriculumContext(studentId);
    if (!context?.curriculum_id) return new Map();

    const { rows } = await db.query(
      `SELECT course_id, MIN(year_level)::int AS year_level
         FROM curriculum_courses
        WHERE curriculum_id = $1
        GROUP BY course_id`,
      [context.curriculum_id]
    );
    return new Map(rows.map((row) => [row.course_id, Number(row.year_level)]));
  }

  /**
   * Map of course_id -> whether the student's latest active attempt is a pass.
   * @returns {Promise<Map<number, boolean>>}
   */
  static async getCoursePassedMap(studentId) {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (course_id) course_id, remarks
         FROM grades
        WHERE student_id = $1 AND archived_at IS NULL
        ORDER BY course_id, year_level DESC, semester_id DESC`,
      [studentId]
    );
    return new Map(rows.map((row) => [row.course_id, row.remarks === 'P']));
  }

  /**
   * For each course, whether the student has passed all of its prerequisites.
   * `courses.prerequisites` is a comma-separated list of course ids; tokens that
   * are not numeric are ignored.
   *
   * @param {number} studentId
   * @param {number[]} courseIds
   * @returns {Promise<Map<number, { eligible: boolean, missing: string[], missingIds: number[] }>>}
   *   `missing` holds course codes (or "#id" when a code is unknown).
   */
  static async checkPrerequisiteEligibility(studentId, courseIds) {
    if (!courseIds || courseIds.length === 0) return new Map();

    const { rows: courses } = await db.query(
      `SELECT course_id, prerequisites
         FROM courses
        WHERE course_id = ANY($1::int[])`,
      [courseIds]
    );

    const prerequisiteTokens = (course) =>
      (course.prerequisites || '')
        .split(',')
        .map((token) => token.trim())
        .filter((token) => /^\d+$/.test(token));

    const prereqIds = new Set();
    for (const course of courses) {
      for (const token of prerequisiteTokens(course)) prereqIds.add(Number(token));
    }

    const passed = new Set();
    const codeById = new Map();
    if (prereqIds.size > 0) {
      const ids = [...prereqIds];

      const { rows: grades } = await db.query(
        `SELECT DISTINCT ON (course_id) course_id, remarks
           FROM grades
          WHERE student_id = $1 AND course_id = ANY($2::int[]) AND archived_at IS NULL
          ORDER BY course_id, year_level DESC, semester_id DESC`,
        [studentId, ids]
      );
      for (const grade of grades) {
        if (grade.remarks === 'P') passed.add(grade.course_id);
      }

      const { rows: codes } = await db.query(
        'SELECT course_id, course_code FROM courses WHERE course_id = ANY($1::int[])',
        [ids]
      );
      for (const row of codes) codeById.set(row.course_id, row.course_code);
    }

    const result = new Map();
    for (const course of courses) {
      const missingIds = prerequisiteTokens(course)
        .map(Number)
        .filter((id) => !passed.has(id));

      result.set(course.course_id, {
        eligible: missingIds.length === 0,
        missing: missingIds.map((id) => codeById.get(id) || `#${id}`),
        missingIds,
      });
    }
    return result;
  }

  /**
   * Active courses with their grading category and enterable score fields.
   * @returns {Promise<object[]>}
   */
  static async getGradableCourses() {
    const { rows } = await db.query(
      `SELECT course_id, course_code, course_name, total_units, lab_units, grading_scheme
         FROM courses
        WHERE is_active = true
        ORDER BY course_code ASC`
    );

    return rows.map((course) => ({
      courseId: course.course_id,
      courseCode: course.course_code,
      courseName: course.course_name,
      units: course.total_units,
      category: GradingEngine.getCourseCategory(course),
      enterableFields: GradingEngine.getEnterableFields(course),
    }));
  }

  // -------------------------------------------------------------------------
  // Grade sheet
  // -------------------------------------------------------------------------

  /**
   * Build the student's full grade sheet: every curriculum course by year and
   * semester, plus retakes that fall outside their native curriculum slot.
   *
   * @param {number} studentId
   * @returns {Promise<object|null>} null when the student has no curriculum record
   */
  static async getGradeSheet(studentId) {
    const context = await this.getStudentCurriculumContext(studentId);
    if (!context) return null;

    const {
      curriculum_id: curriculumId,
      current_year_level: currentYearLevel,
      program_name: programName,
      program_abbr: programAbbr,
      total_year: totalYear,
    } = context;

    const [curriculumCourses, gradeRows, semesters] = await Promise.all([
      db.query(
        `SELECT
           cc.year_level,
           cc.semester_id,
           sem.semester_label,
           co.course_id,
           co.course_code,
           co.course_name,
           co.total_units,
           co.lab_units,
           co.grading_scheme
         FROM curriculum_courses cc
         JOIN courses co ON co.course_id = cc.course_id
         JOIN semester sem ON sem.semester_id = cc.semester_id
         WHERE cc.curriculum_id = $1
         ORDER BY cc.year_level ASC, cc.semester_id ASC, co.course_code ASC`,
        [curriculumId]
      ),
      db.query(
        `SELECT
           g.grade_id, g.course_id, g.year_id, g.semester_id, g.year_level,
           g.final_grade, g.remarks,
           g.prelim_raw, g.prelim_transmuted,
           g.midterm_raw, g.midterm_transmuted,
           g.final_raw, g.final_transmuted,
           gc.term, gc.component_name, gc.score
         FROM grades g
         LEFT JOIN grade_components gc ON gc.grade_id = g.grade_id
         WHERE g.student_id = $1 AND g.archived_at IS NULL`,
        [studentId]
      ),
      db.query('SELECT semester_id, semester_label FROM semester'),
    ]);

    const semesterLabels = new Map(semesters.rows.map((r) => [r.semester_id, r.semester_label]));
    const semesterLabel = (id) => semesterLabels.get(id) || `Semester ${id}`;

    // Group score components under their grade attempt, per course.
    const attemptsByCourse = new Map();
    const attemptsById = new Map();
    for (const row of gradeRows.rows) {
      let attempt = attemptsById.get(row.grade_id);
      if (!attempt) {
        attempt = {
          gradeId: row.grade_id,
          yearId: row.year_id,
          semesterId: row.semester_id,
          yearLevel: row.year_level,
          finalGrade: row.final_grade,
          remarks: row.remarks,
          prelim_raw: row.prelim_raw,
          prelim_transmuted: row.prelim_transmuted,
          midterm_raw: row.midterm_raw,
          midterm_transmuted: row.midterm_transmuted,
          final_raw: row.final_raw,
          final_transmuted: row.final_transmuted,
          scoresByTerm: emptyScores(),
        };
        attemptsById.set(row.grade_id, attempt);
        if (!attemptsByCourse.has(row.course_id)) attemptsByCourse.set(row.course_id, []);
        attemptsByCourse.get(row.course_id).push(attempt);
      }
      if (row.term && row.component_name) {
        attempt.scoresByTerm[row.term][row.component_name] = row.score;
      }
    }

    // Metadata for every attempted course (retakes may be outside the curriculum).
    const attemptedCourseIds = [...attemptsByCourse.keys()];
    const attemptedCourses = attemptedCourseIds.length
      ? (await db.query(
          `SELECT course_id, course_code, course_name, total_units, lab_units, grading_scheme
             FROM courses
            WHERE course_id = ANY($1::int[])`,
          [attemptedCourseIds]
        )).rows
      : [];
    const courseMetaById = new Map(attemptedCourses.map((c) => [c.course_id, c]));

    const allCourseIds = new Set(curriculumCourses.rows.map((c) => c.course_id));
    for (const courseId of attemptedCourseIds) allCourseIds.add(courseId);
    const eligibilityMap = await this.checkPrerequisiteEligibility(studentId, [...allCourseIds]);

    // year level -> semester id -> { semesterId, semesterLabel, courses }
    const yearMap = new Map();
    const ensureSemester = (yearLevel, semesterId, label) => {
      if (!yearMap.has(yearLevel)) yearMap.set(yearLevel, new Map());
      const semesterMap = yearMap.get(yearLevel);
      if (!semesterMap.has(semesterId)) {
        semesterMap.set(semesterId, { semesterId, semesterLabel: label, courses: [] });
      }
      return semesterMap.get(semesterId);
    };

    // Pass 1: curriculum slots. Show the attempt for that slot, else the latest one.
    for (const course of curriculumCourses.rows) {
      const slotYear = Number(course.year_level);
      const slotSemester = Number(course.semester_id);
      const semester = ensureSemester(slotYear, slotSemester, course.semester_label);

      const attempts = attemptsByCourse.get(course.course_id) || [];
      const exact = attempts.find(
        (a) => Number(a.yearLevel) === slotYear && Number(a.semesterId) === slotSemester
      );
      const latest = [...attempts].sort(
        (a, b) => (b.yearLevel - a.yearLevel) || (b.semesterId - a.semesterId)
      )[0] || null;

      semester.courses.push(
        this._buildCourseRow(course, exact || latest, attempts, eligibilityMap, true)
      );
    }

    // Pass 2: attempts outside their native curriculum slot (retakes, extra courses).
    for (const [courseId, attempts] of attemptsByCourse.entries()) {
      const courseMeta = courseMetaById.get(courseId);
      if (!courseMeta) continue;

      const nativeSlot = curriculumCourses.rows.find((r) => r.course_id === courseId);
      const nativeYear = nativeSlot ? Number(nativeSlot.year_level) : null;
      const nativeSemester = nativeSlot ? Number(nativeSlot.semester_id) : null;

      for (const attempt of attempts) {
        const attemptYear = Number(attempt.yearLevel);
        const attemptSemester = Number(attempt.semesterId);

        if (nativeYear !== null && attemptYear === nativeYear && attemptSemester === nativeSemester) {
          continue;
        }

        const semester = ensureSemester(attemptYear, attemptSemester, semesterLabel(attemptSemester));
        const alreadyShown = semester.courses.some(
          (row) => row.courseId === courseId && row.gradeId === attempt.gradeId
        );
        if (alreadyShown) continue;

        semester.courses.push(this._buildCourseRow(courseMeta, attempt, attempts, eligibilityMap, false));
      }
    }

    const years = [...yearMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([yearLevel, semesterMap]) => ({
        yearLevel,
        semesters: [...semesterMap.values()].sort((a, b) => a.semesterId - b.semesterId),
      }));

    return {
      curriculumId,
      programName,
      programAbbr,
      totalYears: totalYear,
      currentYearLevel,
      gradeScale: GradingEngine.getGradeScale(),
      years,
    };
  }

  /**
   * One course row of the grade sheet. Computed values are used only when the
   * stored attempt has none. `inCurriculum` is true for the curriculum's own
   * slot (always listed, so it cannot be removed from the sheet) and false for
   * extra attempts such as retakes and off-curriculum courses.
   * @private
   */
  static _buildCourseRow(courseMeta, attempt, allAttempts, eligibilityMap, inCurriculum) {
    const category = GradingEngine.getCourseCategory(courseMeta);
    const scoresByTerm = attempt?.scoresByTerm || emptyScores();
    const cumulative = attempt
      ? GradingEngine.computeCumulativeGrade(courseMeta, scoresByTerm)
      : { finalGrade: null, remarks: null };

    const eligibility = eligibilityMap.get(courseMeta.course_id)
      || { eligible: true, missing: [], missingIds: [] };

    return {
      courseId: courseMeta.course_id,
      inCurriculum,
      courseCode: courseMeta.course_code,
      courseName: courseMeta.course_name,
      units: courseMeta.total_units,
      category,
      enterableFields: GradingEngine.getEnterableFields(courseMeta),
      prereqEligible: eligibility.eligible,
      prereqMissing: eligibility.missing,
      prereqMissingIds: eligibility.missingIds,
      gradeId: attempt?.gradeId || null,
      finalGrade: attempt?.finalGrade ?? cumulative.finalGrade,
      remarks: attempt?.remarks || cumulative.remarks,
      prelim_raw: attempt?.prelim_raw ?? null,
      prelim_transmuted: attempt?.prelim_transmuted ?? null,
      midterm_raw: attempt?.midterm_raw ?? null,
      midterm_transmuted: attempt?.midterm_transmuted ?? null,
      final_raw: attempt?.final_raw ?? null,
      final_transmuted: attempt?.final_transmuted ?? null,
      scoresByTerm,
      termGrades: {
        Prelim: GradingEngine.computeTermGrade(category, 'Prelim', scoresByTerm),
        Midterm: GradingEngine.computeTermGrade(category, 'Midterm', scoresByTerm),
        Final: GradingEngine.computeTermGrade(category, 'Final', scoresByTerm),
      },
      attemptCount: allAttempts.length,
      attempts: allAttempts.map((a) => ({
        gradeId: a.gradeId,
        yearId: a.yearId,
        semesterId: a.semesterId,
        yearLevel: a.yearLevel,
        finalGrade: a.finalGrade,
        remarks: a.remarks,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Saving grades
  // -------------------------------------------------------------------------

  /**
   * Year and semester a grade belongs to: the student's enrolment record for that
   * year level and semester, else the active academic year.
   * @returns {Promise<{ year_id: number|null, semester_id: number }>}
   */
  static async resolveAcademicPeriod(client, studentId, yearLevel, semesterId) {
    const { rows } = await client.query(
      `SELECT year_id, semester_id
         FROM student_education
        WHERE student_id = $1 AND year_level = $2 AND semester_id = $3
        ORDER BY education_id DESC
        LIMIT 1`,
      [studentId, yearLevel, semesterId]
    );
    if (rows.length > 0) return rows[0];

    const active = await this.getActiveAcademicTerm(client);
    return { year_id: active.year_id, semester_id: semesterId };
  }

  /**
   * Grades may only be saved for active students. A student is blocked when the
   * student record is inactive or archived, or the login account is deactivated.
   * @private
   * @throws {HttpError} 404 if the student does not exist, 400 if not active
   */
  static async _assertStudentActive(studentId, client = db) {
    const { rows } = await client.query(
      `SELECT s.account_status, s.archived_at, u.is_active
         FROM students s
         LEFT JOIN users u ON u.user_id = s.user_id
        WHERE s.student_id = $1`,
      [studentId]
    );
    const student = rows[0];
    if (!student) throw new HttpError(404, 'Student not found.');

    if (student.account_status === false || student.archived_at || student.is_active === false) {
      throw new HttpError(400, 'Cannot save grades for an inactive or archived student.');
    }
  }

  /**
   * Save one or more grade entries for a student, atomically: either every
   * entry is saved or none is.
   *
   * Each entry is an upsert on (student, course, year, semester, year level), so
   * re-saving a course updates it and un-archives it. Component scores and
   * prerequisite overrides are replaced with the submitted ones.
   *
   * @param {number} studentId
   * @param {number|null} facultyId  faculties.faculty_id of the grader, or null
   * @param {object[]} entries  { courseId, yearLevel, semesterId, scoresByTerm,
   *                              missingPrereqs?, prelim_raw?, ..., remarks? }
   * @returns {Promise<object[]>} one summary per entry, for audit logging:
   *   { gradeId, courseId, courseCode, yearLevel, semesterId,
   *     missingPrereqIds, missingPrereqCodes }
   * @throws {HttpError} 400 on invalid input, a rule violation, or an inactive or
   *   archived student; 404 if the student does not exist
   */
  static async saveGrades(studentId, facultyId, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new HttpError(400, 'No grade entries provided.');
    }

    entries.forEach((entry) => this._assertValidEntry(entry));
    await this._assertStudentActive(studentId);

    const context = await this.getStudentCurriculumContext(studentId);

    const saved = [];
    await withTransaction(async (client) => {
      for (const entry of entries) {
        saved.push(await this._saveEntry(client, studentId, facultyId, context, entry));
      }
    });
    return saved;
  }

  /**
   * Validate one entry's shape and numeric ranges before touching the database.
   * @private
   * @throws {HttpError}
   */
  static _assertValidEntry(entry) {
    const { courseId, yearLevel, semesterId, scoresByTerm } = entry ?? {};

    if (!courseId || !yearLevel || !semesterId || !scoresByTerm || typeof scoresByTerm !== 'object') {
      throw new HttpError(
        400,
        'Incomplete grade entry: course, year level, semester, and scores are required.'
      );
    }
    if (!Number.isInteger(Number(yearLevel)) || Number(yearLevel) < 1) {
      throw new HttpError(400, 'Year level must be a positive whole number.');
    }

    const marks = [
      ['Prelim raw', entry.prelim_raw],
      ['Prelim transmuted', entry.prelim_transmuted],
      ['Midterm raw', entry.midterm_raw],
      ['Midterm transmuted', entry.midterm_transmuted],
      ['Final raw', entry.final_raw],
      ['Final transmuted', entry.final_transmuted],
    ];
    for (const [label, value] of marks) {
      if (isBlank(value)) continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n < MARK_RANGE.min || n > MARK_RANGE.max) {
        throw new HttpError(400, `${label} must be between ${MARK_RANGE.min} and ${MARK_RANGE.max}.`);
      }
    }

    for (const term of TERMS) {
      for (const [component, score] of Object.entries(scoresByTerm[term] || {})) {
        if (isBlank(score)) continue;
        const n = Number(score);
        if (!Number.isFinite(n) || n < SCORE_RANGE.min || n > SCORE_RANGE.max) {
          throw new HttpError(
            400,
            `${term} ${component} score must be between ${SCORE_RANGE.min} and ${SCORE_RANGE.max}.`
          );
        }
      }
    }
  }

  /**
   * Save a single entry inside a transaction.
   * @private
   */
  static async _saveEntry(client, studentId, facultyId, context, entry) {
    const { courseId, yearLevel, semesterId, scoresByTerm, missingPrereqs } = entry;

    const { rows: courseRows } = await client.query(
      `SELECT course_id, course_code, lab_units, grading_scheme
         FROM courses
        WHERE course_id = $1`,
      [courseId]
    );
    const course = courseRows[0];
    if (!course) throw new HttpError(400, `Course ${courseId} not found.`);

    // A student may hold grades for a year they have not reached (advance or
    // off-curriculum courses), but not for a year beyond the program's length.
    if (context?.total_year && Number(yearLevel) > Number(context.total_year)) {
      throw new HttpError(
        400,
        `Year ${yearLevel} is beyond the length of the program (${context.total_year} years).`
      );
    }

    const period = await this.resolveAcademicPeriod(client, studentId, yearLevel, semesterId);
    if (!period.year_id) {
      throw new HttpError(
        400,
        'Unable to determine an academic year for this grade entry. ' +
        'Please ensure an academic year is marked active.'
      );
    }

    const category = GradingEngine.getCourseCategory(course);
    const { finalGrade, remarks: computedRemarks } =
      GradingEngine.computeCumulativeGrade(course, scoresByTerm);
    // A remark picked manually in the UI wins over the computed one.
    const remarks = entry.remarks || computedRemarks;

    const { rows } = await client.query(
      `INSERT INTO grades
         (student_id, course_id, year_id, semester_id, year_level, faculty_id, final_grade, remarks,
          prelim_raw, prelim_transmuted, midterm_raw, midterm_transmuted,
          final_raw, final_transmuted, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (student_id, course_id, year_id, semester_id, year_level) DO UPDATE SET
         faculty_id = EXCLUDED.faculty_id,
         final_grade = EXCLUDED.final_grade,
         remarks = EXCLUDED.remarks,
         prelim_raw = EXCLUDED.prelim_raw,
         prelim_transmuted = EXCLUDED.prelim_transmuted,
         midterm_raw = EXCLUDED.midterm_raw,
         midterm_transmuted = EXCLUDED.midterm_transmuted,
         final_raw = EXCLUDED.final_raw,
         final_transmuted = EXCLUDED.final_transmuted,
         archived_at = NULL,
         archive_reason = NULL,
         updated_at = NOW()
       RETURNING grade_id`,
      [
        studentId, courseId, period.year_id, period.semester_id, Number(yearLevel),
        facultyId || null, finalGrade, remarks,
        toNumberOrNull(entry.prelim_raw), toNumberOrNull(entry.prelim_transmuted),
        toNumberOrNull(entry.midterm_raw), toNumberOrNull(entry.midterm_transmuted),
        toNumberOrNull(entry.final_raw), toNumberOrNull(entry.final_transmuted),
      ]
    );
    const gradeId = rows[0].grade_id;

    const overrides = await this._replacePrereqOverrides(client, gradeId, missingPrereqs);
    await this._replaceComponents(client, gradeId, category, scoresByTerm);

    return {
      gradeId,
      courseId,
      courseCode: course.course_code,
      yearLevel: Number(yearLevel),
      semesterId: period.semester_id,
      missingPrereqIds: overrides.ids,
      missingPrereqCodes: overrides.codes,
    };
  }

  /**
   * Replace a grade's prerequisite overrides (prerequisites waived for this attempt).
   * @private
   * @returns {Promise<{ ids: number[], codes: string[] }>}
   */
  static async _replacePrereqOverrides(client, gradeId, missingPrereqs) {
    await client.query('DELETE FROM grade_prereq_overrides WHERE grade_id = $1', [gradeId]);

    const ids = [...new Set((Array.isArray(missingPrereqs) ? missingPrereqs : []).map(Number))];
    if (ids.length === 0) return { ids: [], codes: [] };

    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new HttpError(400, 'missingPrereqs must be a list of course ids.');
    }

    const placeholders = ids.map((_, i) => `($1, $${i + 2})`).join(', ');
    await client.query(
      `INSERT INTO grade_prereq_overrides (grade_id, missing_prereq_course_id) VALUES ${placeholders}`,
      [gradeId, ...ids]
    );

    const { rows } = await client.query(
      'SELECT course_id, course_code FROM courses WHERE course_id = ANY($1::int[])',
      [ids]
    );
    const codeById = new Map(rows.map((r) => [r.course_id, r.course_code]));

    return { ids, codes: ids.map((id) => codeById.get(id) || `#${id}`) };
  }

  /**
   * Replace a grade's component scores. Blank scores are skipped. The stored
   * percentage records the weight in effect when saved; calculations never read it.
   * @private
   */
  static async _replaceComponents(client, gradeId, category, scoresByTerm) {
    await client.query('DELETE FROM grade_components WHERE grade_id = $1', [gradeId]);

    const rows = [];
    for (const term of TERMS) {
      for (const [component, score] of Object.entries(scoresByTerm[term] || {})) {
        if (isBlank(score)) continue;
        rows.push([
          term,
          component,
          Number(score),
          GradingEngine.getComponentWeight(category, term, component),
        ]);
      }
    }
    if (rows.length === 0) return;

    const placeholders = rows
      .map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`)
      .join(', ');
    await client.query(
      `INSERT INTO grade_components (grade_id, term, component_name, score, percentage)
       VALUES ${placeholders}`,
      [gradeId, ...rows.flat()]
    );
  }

  // -------------------------------------------------------------------------
  // Archive, restore, delete
  // -------------------------------------------------------------------------

  /**
   * Delete a course assignment that has no grades saved: no component scores and
   * no manual raw/transmuted marks. A row with any saved grade is never deleted;
   * it has to be archived instead.
   *
   * @returns {Promise<{ deleted: boolean, hasGrades: boolean }>}
   *   `hasGrades` is true when a matching row exists but was kept because it has grades
   */
  static async deleteEmptyAssignment(studentId, courseId, yearLevel, semesterId) {
    const { rows } = await db.query(
      `WITH target AS (
         SELECT g.grade_id,
                (EXISTS (SELECT 1 FROM grade_components gc WHERE gc.grade_id = g.grade_id)
                 OR g.prelim_raw IS NOT NULL OR g.prelim_transmuted IS NOT NULL
                 OR g.midterm_raw IS NOT NULL OR g.midterm_transmuted IS NOT NULL
                 OR g.final_raw IS NOT NULL OR g.final_transmuted IS NOT NULL) AS has_grades
           FROM grades g
          WHERE g.student_id = $1 AND g.course_id = $2
            AND g.year_level = $3 AND g.semester_id = $4
       ),
       removed AS (
         DELETE FROM grades
          WHERE grade_id IN (SELECT grade_id FROM target WHERE NOT has_grades)
          RETURNING grade_id
       )
       SELECT (SELECT COUNT(*) FROM removed)::int AS deleted,
              (SELECT COUNT(*) FROM target WHERE has_grades)::int AS kept`,
      [studentId, courseId, yearLevel, semesterId]
    );
    return { deleted: rows[0].deleted > 0, hasGrades: rows[0].kept > 0 };
  }

  /**
   * Archive a grade with a reason.
   * @param {number} gradeId
   * @param {{ reason: string, studentId?: number|null }} options
   *   `studentId`, when given, restricts the change to that student's grades.
   * @returns {Promise<object|null>} what was archived (with course_code), or null
   *   if the grade does not exist, is already archived, or belongs to another student
   */
  static async archiveGradeById(gradeId, { reason, studentId = null }) {
    const { rows } = await db.query(
      `WITH updated AS (
         UPDATE grades
            SET archived_at = NOW(), archive_reason = $2, updated_at = NOW()
          WHERE grade_id = $1
            AND archived_at IS NULL
            AND ($3::int IS NULL OR student_id = $3::int)
          RETURNING grade_id, student_id, course_id, year_level, semester_id
       )
       SELECT u.*, c.course_code
         FROM updated u
         LEFT JOIN courses c ON c.course_id = u.course_id`,
      [gradeId, reason, studentId]
    );
    return rows[0] ?? null;
  }

  /**
   * Restore an archived grade.
   * @param {number} gradeId
   * @param {{ studentId?: number|null }} [options]
   * @returns {Promise<object|null>} what was restored (with course_code), or null
   *   if the grade does not exist, is not archived, or belongs to another student
   */
  static async restoreGradeById(gradeId, { studentId = null } = {}) {
    const { rows } = await db.query(
      `WITH updated AS (
         UPDATE grades
            SET archived_at = NULL, archive_reason = NULL, updated_at = NOW()
          WHERE grade_id = $1
            AND archived_at IS NOT NULL
            AND ($2::int IS NULL OR student_id = $2::int)
          RETURNING grade_id, student_id, course_id, year_level, semester_id
       )
       SELECT u.*, c.course_code
         FROM updated u
         LEFT JOIN courses c ON c.course_id = u.course_id`,
      [gradeId, studentId]
    );
    return rows[0] ?? null;
  }

  /**
   * @returns {Promise<object[]>} the student's archived grades, newest first
   */
  static async getArchivedGradesForStudent(studentId) {
    const { rows } = await db.query(
      `SELECT
         g.grade_id,
         g.course_id,
         g.year_level,
         g.semester_id,
         g.archived_at,
         g.archive_reason,
         c.course_code,
         c.course_name,
         sem.semester_label
       FROM grades g
       JOIN courses c ON c.course_id = g.course_id
       JOIN semester sem ON sem.semester_id = g.semester_id
       WHERE g.student_id = $1 AND g.archived_at IS NOT NULL
       ORDER BY g.archived_at DESC`,
      [studentId]
    );

    return rows.map((r) => ({
      gradeId: r.grade_id,
      courseId: r.course_id,
      courseCode: r.course_code,
      courseName: r.course_name,
      yearLevel: Number(r.year_level),
      semesterId: r.semester_id,
      semesterLabel: r.semester_label,
      archivedAt: r.archived_at,
      archiveReason: r.archive_reason,
    }));
  }

  // -------------------------------------------------------------------------
  // Academic standing
  // -------------------------------------------------------------------------

  /**
   * Academic standing per student, from failed-course counts, unless a verified
   * status override exists for the current term.
   *
   * Rules: a course failed 3+ times or 5+ failures in one semester is
   * Probationary 2; 2+ times or 3+ in a semester is Probationary 1; failing 2 or
   * more distinct courses is a Warning.
   *
   * @param {number[]|null} [studentIds]  limit the work to these students (default: all)
   * @returns {Promise<Map<number, { status: string, isOverridden: boolean }>>}
   */
  static async getAcademicStandingMap(studentIds = null) {
    const aggRes = await db.query(`
      WITH course_repeats AS (
        SELECT student_id, course_id, COUNT(*)::int AS times_failed
        FROM grades
        WHERE remarks = 'F' AND archived_at IS NULL
          AND ($1::int[] IS NULL OR student_id = ANY($1::int[]))
        GROUP BY student_id, course_id
      ),
      semester_fails AS (
        SELECT student_id, year_id, semester_id, COUNT(DISTINCT course_id)::int AS courses_failed
        FROM grades
        WHERE remarks = 'F' AND archived_at IS NULL
          AND ($1::int[] IS NULL OR student_id = ANY($1::int[]))
        GROUP BY student_id, year_id, semester_id
      )
      SELECT 
        s.student_id,
        COALESCE(MAX(cr.times_failed), 0) AS max_course_repeat,
        COALESCE(MAX(sf.courses_failed), 0) AS max_semester_fails,
        COUNT(DISTINCT cr.course_id)::int AS total_courses_failed
      FROM students s
      LEFT JOIN course_repeats cr ON cr.student_id = s.student_id
      LEFT JOIN semester_fails sf ON sf.student_id = s.student_id
      WHERE $1::int[] IS NULL OR s.student_id = ANY($1::int[])
      GROUP BY s.student_id
    `, [studentIds]);

    const overrideRes = await db.query(`
      SELECT DISTINCT ON (ss.student_id)
        ss.student_id, ss.probation_status
      FROM student_status ss
      JOIN academic_year ay ON ay.year_id = ss.year_id
        AND ay.is_active = true
        AND ss.semester_id = ay.current_sem
      WHERE ss.verified_by_id IS NOT NULL
        AND ($1::int[] IS NULL OR ss.student_id = ANY($1::int[]))
      ORDER BY ss.student_id, ss.verification_date DESC NULLS LAST, ss.status_id DESC
    `, [studentIds]);

    const overrides = new Map(
      overrideRes.rows.map((r) => [
        r.student_id,
        PROBATION_STATUS_LABELS[r.probation_status] || ACADEMIC_STANDING.NONE,
      ])
    );

    const standingMap = new Map();
    for (const row of aggRes.rows) {
      const override = overrides.get(row.student_id);
      if (override) {
        standingMap.set(row.student_id, { status: override, isOverridden: true });
        continue;
      }

      const { max_course_repeat, max_semester_fails, total_courses_failed } = row;
      let status = ACADEMIC_STANDING.NONE;

      if (max_course_repeat >= 3 || max_semester_fails >= 5) {
        status = ACADEMIC_STANDING.PROBATIONARY_2;
      } else if (max_course_repeat >= 2 || max_semester_fails >= 3) {
        status = ACADEMIC_STANDING.PROBATIONARY_1;
      } else if (total_courses_failed >= 2) {
        status = ACADEMIC_STANDING.WARNING;
      }

      standingMap.set(row.student_id, { status, isOverridden: false });
    }

    return standingMap;
  }
}

module.exports = GradeManageModel;