/**
 * ============================================================================
 * GradeManageModel
 * ============================================================================
 * Data access layer for viewing and recording student grades.
 *
 * A student's "grade sheet" is assembled from four tables:
 *
 *   1. curriculum_courses  -> the fixed list of courses a curriculum requires,
 *                             organized by year_level + semester_id (term type,
 *                             e.g. 1st Sem / 2nd Sem / Summer).
 *   2. courses               -> lec_units/lab_units/grading_scheme, which
 *                             determine a course's grading category
 *                             (see GradingEngine.getCourseCategory).
 *   3. grades               -> the recorded outcome for a specific
 *                             (student, course, academic_year, term) combo -
 *                             final_grade here is the CUMULATIVE course
 *                             grade (GradingEngine.computeCumulativeGrade),
 *                             not any single term's score. Also stores the
 *                             curricular year_level the attempt was taken in,
 *                             so retakes placed in a later year stay distinct.
 *   4. grade_components     -> named sub-scores per term (Quizzes/AT,
 *                             Prelim/Midterm/Final Exam, Unit Practical
 *                             Exam, OSCE/OSPE, etc. - see gradingEngine.js
 *                             for the full weight tables per category).
 *
 * All grading math (category detection, period-local term grades, the
 * cumulative course grade, and the percentage->grade-point conversion)
 * lives in GradingEngine - this model's job is purely data access: fetch
 * the right rows, hand them to GradingEngine, persist what comes back.
 *
 * IMPORTANT DESIGN NOTE:
 * curriculum_courses does not know *which* academic year a term belongs to —
 * it only knows "Year 2, 1st Semester" in the abstract. The grades table,
 * however, needs a concrete year_id. To resolve this, every grade entry is
 * anchored to the academic year taken from the student's own enrollment
 * history (student_education). If the student does not yet have a
 * student_education row for that year_level/semester (e.g. an admin is
 * pre-encoding a grade for a term the student hasn't formally reached),
 * the model falls back to the currently active academic year so the record
 * still has a valid anchor. See resolveAcademicPeriod().
 * ============================================================================
 */

const db = require('../config/db');
const GradingEngine = require('./gradingEngine');

/**
 * Academic standing tiers, derived from a student's failed-grade history.
 * Mirrors the enum used by student_status.probation_status, except 'None'
 * is displayed as 'Regular' to match how the masterlist presents it.
 */
const ACADEMIC_STANDING = {
  NONE: 'None',
  WARNING: 'Warning',
  PROBATIONARY_1: 'Probationary 1',
  PROBATIONARY_2: 'Probationary 2'
};

/** Maps the raw student_status.probation_status enum value to a display label. */
const PROBATION_STATUS_LABELS = {
  None: ACADEMIC_STANDING.NONE,
  Warning: ACADEMIC_STANDING.WARNING,
  'Probationary 1': ACADEMIC_STANDING.PROBATIONARY_1,
  'Probationary 2': ACADEMIC_STANDING.PROBATIONARY_2
};

class GradeManageModel {

  /**
   * Fetches the currently active academic year + its active semester.
   * Used as a fallback anchor when recording a grade for a term the
   * student has no student_education row for yet.
   *
   * @param {import('pg').PoolClient|import('pg').Pool} client
   */
  static async getActiveAcademicTerm(client = db) {
    const res = await client.query(`
      SELECT year_id, current_sem AS semester_id
      FROM academic_year
      WHERE is_active = true
      LIMIT 1
    `);
    return res.rows[0] || { year_id: null, semester_id: null };
  }

  /**
   * Resolves the student's active curriculum/program context, used as the
   * source of truth for which courses belong on their grade sheet.
   * Prefers the student's current (is_current = true) enrollment record,
   * falling back to their most recent one otherwise.
   *
   * @param {number} studentId
   */
  static async getStudentCurriculumContext(studentId) {
    const res = await db.query(`
      SELECT 
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
      LIMIT 1
    `, [studentId]);

    return res.rows[0] || null;
  }

  /**
   * Builds the complete grade sheet for a student: every course required by
   * their curriculum, grouped by year level then semester/term, merged with
   * any grades + grade_components already on file.
   *
   * RETAKES: a course can have multiple grade rows for the same student, one
   * per (year_id, semester_id) it was attempted in. Each attempt is its own
   * row in the sheet, placed in the (year_level, semester_id) it was actually
   * taken in. Placement uses grades.year_level — a stored fact — rather than
   * inferring it from the student's current year level, which would be wrong
   * for retakes that happened in a past year.
   *
   * Every row carries attemptCount + attempts[] so the UI can badge retakes.
   *
   * @param {number} studentId
   * @returns {Promise<object|null>} null if the student has no enrollment
   *   record (and therefore no curriculum to build a grade sheet from).
   */
  static async getGradeSheet(studentId) {
    const context = await this.getStudentCurriculumContext(studentId);
    if (!context) return null;

    const { curriculum_id, current_year_level, program_name, program_abbr, total_year } = context;

    // 1. Every course required by this curriculum, plus what determines its
    //    grading category (see GradingEngine.getCourseCategory).
    const coursesRes = await db.query(`
      SELECT 
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
      ORDER BY cc.year_level ASC, cc.semester_id ASC, co.course_code ASC
    `, [curriculum_id]);

    // 2. Every grade (and its named term components) already recorded for
    //    this student. Multiple rows per course are possible (retakes).
    const gradesRes = await db.query(`
      SELECT 
        g.grade_id,
        g.course_id,
        g.year_id,
        g.semester_id,
        g.year_level,
        g.final_grade,
        g.remarks,
        gc.term,
        gc.component_name,
        gc.score
      FROM grades g
      LEFT JOIN grade_components gc ON gc.grade_id = g.grade_id
      WHERE g.student_id = $1
    `, [studentId]);

    // Group attempts per course_id. Each attempt = one grade_id, carrying
    // its own (year_id, semester_id, year_level) placement and scores.
    const attemptsByCourse = new Map();
    for (const row of gradesRes.rows) {
      if (!attemptsByCourse.has(row.course_id)) attemptsByCourse.set(row.course_id, []);

      const attempts = attemptsByCourse.get(row.course_id);
      let attempt = attempts.find((a) => a.gradeId === row.grade_id);
      if (!attempt) {
        attempt = {
          gradeId: row.grade_id,
          yearId: row.year_id,
          semesterId: row.semester_id,
          yearLevel: row.year_level,
          finalGrade: row.final_grade,
          remarks: row.remarks,
          scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} }
        };
        attempts.push(attempt);
      }
      if (row.term && row.component_name) {
        attempt.scoresByTerm[row.term][row.component_name] = row.score;
      }
    }

    // Cache semester labels so synthetic buckets are never shown as "undefined".
    const semLabelCache = new Map();
    const getSemesterLabel = async (semesterId) => {
      if (semLabelCache.has(semesterId)) return semLabelCache.get(semesterId);
      const res = await db.query(
        `SELECT semester_label FROM semester WHERE semester_id = $1`,
        [semesterId]
      );
      const label = res.rows[0]?.semester_label || `Semester ${semesterId}`;
      semLabelCache.set(semesterId, label);
      return label;
    };

    // --- Build the year -> semester -> courses tree.
    const yearMap = new Map();
    const ensureYearAndSem = (yearLevel, semesterId, semesterLabel) => {
      if (!yearMap.has(yearLevel)) yearMap.set(yearLevel, new Map());
      const semMap = yearMap.get(yearLevel);
      if (!semMap.has(semesterId)) {
        semMap.set(semesterId, {
          semesterId,
          semesterLabel,
          courses: []
        });
      }
      return semMap.get(semesterId);
    };

    // Helper: build the row payload for one (course, attempt) pair.
    const buildCourseRow = (courseMeta, attempt, allAttempts) => {
      const category = GradingEngine.getCourseCategory(courseMeta);
      const scoresByTerm = attempt?.scoresByTerm || { Prelim: {}, Midterm: {}, Final: {} };
      const cumulative = attempt
        ? GradingEngine.computeCumulativeGrade(courseMeta, scoresByTerm)
        : { finalGrade: null, remarks: null };

      return {
        courseId: courseMeta.course_id,
        courseCode: courseMeta.course_code,
        courseName: courseMeta.course_name,
        units: courseMeta.total_units,
        category,
        enterableFields: GradingEngine.getEnterableFields(courseMeta),
        gradeId: attempt?.gradeId || null,
        finalGrade: attempt?.finalGrade ?? cumulative.finalGrade,
        remarks: attempt?.remarks || cumulative.remarks,
        scoresByTerm,
        termGrades: {
          Prelim: GradingEngine.computeTermGrade(category, 'Prelim', scoresByTerm),
          Midterm: GradingEngine.computeTermGrade(category, 'Midterm', scoresByTerm),
          Final: GradingEngine.computeTermGrade(category, 'Final', scoresByTerm)
        },
        attemptCount: allAttempts.length,
        attempts: allAttempts.map((a) => ({
          gradeId: a.gradeId,
          yearId: a.yearId,
          semesterId: a.semesterId,
          yearLevel: a.yearLevel,
          finalGrade: a.finalGrade,
          remarks: a.remarks
        }))
      };
    };

    // Pass 1 — one row per curriculum slot. Attach the attempt whose
    // (year_level, semester_id) matches the slot's own placement.
    for (const c of coursesRes.rows) {
      const slotYear = Number(c.year_level);
      const slotSem = Number(c.semester_id);
      const sem = ensureYearAndSem(slotYear, slotSem, c.semester_label);

      const attempts = attemptsByCourse.get(c.course_id) || [];
      const exact = attempts.find(
        (a) => Number(a.yearLevel) === slotYear && Number(a.semesterId) === slotSem
      );
      const latest = [...attempts].sort(
        (a, b) => (b.yearLevel - a.yearLevel) || (b.semesterId - a.semesterId)
      )[0] || null;
      const chosen = exact || latest;

      sem.courses.push(buildCourseRow(c, chosen, attempts));
    }

    // Pass 2 — retakes. Any attempt whose (year_level, semester_id) does NOT
    // match its curriculum slot gets its own row, placed in the year+semester
    // it was actually taken in.
    for (const [courseId, attempts] of attemptsByCourse.entries()) {
      const metaRes = await db.query(`
        SELECT course_id, course_code, course_name, total_units, lab_units, grading_scheme
        FROM courses WHERE course_id = $1
      `, [courseId]);
      const courseMeta = metaRes.rows[0];
      if (!courseMeta) continue;

      const nativeSlot = coursesRes.rows.find((r) => r.course_id === courseId);
      const nativeYear = nativeSlot ? Number(nativeSlot.year_level) : null;
      const nativeSem = nativeSlot ? Number(nativeSlot.semester_id) : null;

      for (const attempt of attempts) {
        const aYear = Number(attempt.yearLevel);
        const aSem = Number(attempt.semesterId);

        if (nativeYear !== null && aYear === nativeYear && aSem === nativeSem) continue;

        const label = await getSemesterLabel(aSem);
        const targetSem = ensureYearAndSem(aYear, aSem, label);

        if (targetSem.courses.some(
          (r) => r.courseId === courseId && r.gradeId === attempt.gradeId
        )) continue;

        targetSem.courses.push(buildCourseRow(courseMeta, attempt, attempts));
      }
    }

    // --- Flatten into the shape the modal consumes.
    const years = Array.from(yearMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([yearLevel, semMap]) => ({
        yearLevel,
        semesters: Array.from(semMap.values()).sort((a, b) => a.semesterId - b.semesterId)
      }));

    return {
      curriculumId: curriculum_id,
      programName: program_name,
      programAbbr: program_abbr,
      totalYears: total_year,
      currentYearLevel: current_year_level,
      gradeScale: GradingEngine.getGradeScale(),
      years
    };
  }

  /**
   * Every active course, with its grading category + enterableFields
   * already resolved via GradingEngine. Powers AddGrade.js's "add course"
   * picker for manually adding a row beyond the curriculum's defaults
   * (e.g. a retake, an elective, or a shifting student's carried-over
   * course) - resolved server-side so the frontend never needs its own
   * copy of GradingEngine's category/weight logic.
   *
   * @returns {Promise<Array<object>>}
   */
  static async getGradableCourses() {
    const res = await db.query(`
      SELECT course_id, course_code, course_name, total_units, lab_units, grading_scheme
      FROM courses
      WHERE is_active = true
      ORDER BY course_code ASC
    `);

    return res.rows.map((course) => ({
      courseId: course.course_id,
      courseCode: course.course_code,
      courseName: course.course_name,
      units: course.total_units,
      category: GradingEngine.getCourseCategory(course),
      enterableFields: GradingEngine.getEnterableFields(course)
    }));
  }

  /**
   * Determines the real academic_year to anchor a grade entry to, based on
   * the student's own enrollment history. Falls back to the currently
   * active academic year if the student has no matching student_education
   * row yet for that year_level/semester (see module header note).
   *
   * @param {import('pg').PoolClient} client - transaction-bound client.
   */
  static async resolveAcademicPeriod(client, studentId, yearLevel, semesterId) {
    const res = await client.query(`
      SELECT year_id, semester_id 
      FROM student_education 
      WHERE student_id = $1 AND year_level = $2 AND semester_id = $3
      ORDER BY education_id DESC
      LIMIT 1
    `, [studentId, yearLevel, semesterId]);

    if (res.rows.length > 0) return res.rows[0];

    const active = await this.getActiveAcademicTerm(client);
    return { year_id: active.year_id, semester_id: semesterId };
  }

  /**
   * Persists a batch of grade entries for a student inside a single
   * transaction — either the whole batch succeeds or none of it does.
   *
   * Each entry carries a course's FULL set of per-term component scores
   * (not just one term's worth) - GradingEngine.computeCumulativeGrade
   * needs all three terms' data together to produce the official grade,
   * so partial per-term saves aren't supported at this layer; the
   * frontend is expected to submit whatever it currently has for a course
   * across all terms whenever any of it changes.
   *
   * @param {number} studentId
   * @param {number|null} facultyId - id of the recorder, if applicable.
   * @param {Array<{
   *   courseId: number,
   *   yearLevel: number,
   *   semesterId: number,
   *   scoresByTerm: {
   *     Prelim: Object<string, number|string>,
   *     Midterm: Object<string, number|string>,
   *     Final: Object<string, number|string>
   *   }
   * }>} entries
   * @returns {Promise<boolean>}
   */
  static async saveGrades(studentId, facultyId, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('No grade entries provided.');
    }

    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      for (const entry of entries) {
        const { courseId, yearLevel, semesterId, scoresByTerm } = entry;

        if (!courseId || !yearLevel || !semesterId || !scoresByTerm) {
          throw new Error('Incomplete grade entry: course, year level, semester, and scores are required.');
        }

        // Category is derived server-side from the course's own record -
        // never trusted from the client, since it determines the weight
        // table used to compute the official grade.
        const courseRes = await client.query(`
          SELECT course_id, lab_units, grading_scheme FROM courses WHERE course_id = $1
        `, [courseId]);

        if (courseRes.rows.length === 0) {
          throw new Error(`Course ${courseId} not found.`);
        }
        const course = courseRes.rows[0];
        const category = GradingEngine.getCourseCategory(course);

        // Guard: reject grades for year levels the student hasn't reached yet.
        const ctx = await this.getStudentCurriculumContext(studentId);
        if (ctx && Number(yearLevel) > Number(ctx.current_year_level)) {
          throw new Error(
            `Cannot save grades for Year ${yearLevel} — student is currently Year ${ctx.current_year_level}.`
          );
        }

        const { year_id, semester_id } = await this.resolveAcademicPeriod(
          client, studentId, yearLevel, semesterId
        );

        if (!year_id) {
          throw new Error(
            'Unable to determine an academic year for this grade entry. ' +
            'Please ensure an academic year is marked active.'
          );
        }

        const { finalGrade, remarks } = GradingEngine.computeCumulativeGrade(course, scoresByTerm);

        // Upsert the grade header row for this (student, course, year, term).
                const gradeRes = await client.query(`
          INSERT INTO grades (student_id, course_id, year_id, semester_id, year_level, faculty_id, final_grade, remarks, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (student_id, course_id, year_id, semester_id, year_level) DO UPDATE SET
            faculty_id = EXCLUDED.faculty_id,
            final_grade = EXCLUDED.final_grade,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING grade_id
        `, [studentId, courseId, year_id, semester_id, Number(yearLevel), facultyId || null, finalGrade, remarks]);
        
        const gradeId = gradeRes.rows[0].grade_id;

        // Replace all components wholesale — simpler and safer than
        // diffing a variable-length set of named components on every save.
        await client.query(`DELETE FROM grade_components WHERE grade_id = $1`, [gradeId]);

        for (const term of ['Prelim', 'Midterm', 'Final']) {
          const termScores = scoresByTerm[term] || {};
          for (const [component, score] of Object.entries(termScores)) {
            if (score === '' || score === null || score === undefined) continue;

            const weight = GradingEngine.getComponentWeight(category, term, component);
            await client.query(`
              INSERT INTO grade_components (grade_id, term, component_name, score, percentage)
              VALUES ($1, $2, $3, $4, $5)
            `, [gradeId, term, component, Number(score), weight]);
          }
        }
      }

      if (isDedicatedClient) await client.query('COMMIT');
      return true;
    } catch (error) {
      if (isDedicatedClient) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (isDedicatedClient && client.release) client.release();
    }
  }

  /**
   * Computes every student's academic standing from their failed-grade
   * ('F' remarks) history, honoring any Program Head override on file.
   *
   * Auto-computed tiers (evaluated worst-to-best, first match wins):
   *   - Probationary 2: failed the same course 3+ times, OR failed 5+
   *     distinct courses within a single semester.
   *   - Probationary 1: failed the same course 2x, OR failed 3-4 distinct
   *     courses within a single semester.
   *   - Warning: failed 2+ distinct courses cumulatively, regardless of
   *     curricular year (and no Probationary tier already applies).
   *   - Regular: none of the above.
   *
   * Override: if student_status has a *verified* (verified_by_id IS NOT
   * NULL) probation_status recorded for the student's current academic
   * year, that value is used instead of the auto-computed one — this is
   * the "Program Head can override" path.
   *
   * @returns {Promise<Map<number, { status: string, isOverridden: boolean }>>}
   *   Keyed by student_id.
   */
  static async getAcademicStandingMap() {
    // Per-student failure aggregates, computed straight from `grades`.
    const aggRes = await db.query(`
      WITH course_repeats AS (
        -- How many times has each student failed a given course, across all terms?
        SELECT student_id, course_id, COUNT(*)::int AS times_failed
        FROM grades
        WHERE remarks = 'F'
        GROUP BY student_id, course_id
      ),
      semester_fails AS (
        -- How many distinct courses did each student fail within a single semester?
        SELECT student_id, year_id, semester_id, COUNT(DISTINCT course_id)::int AS courses_failed
        FROM grades
        WHERE remarks = 'F'
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
      GROUP BY s.student_id
    `);

    // Program Head overrides: the latest *verified* probation_status per
    // student, scoped to their current (active) academic year.
    const overrideRes = await db.query(`
      SELECT DISTINCT ON (ss.student_id)
        ss.student_id, ss.probation_status
      FROM student_status ss
      JOIN academic_year ay ON ay.year_id = ss.year_id AND ay.is_active = true
      WHERE ss.verified_by_id IS NOT NULL
      ORDER BY ss.student_id, ss.verification_date DESC NULLS LAST, ss.status_id DESC
    `);

    const overrides = new Map(
      overrideRes.rows.map((r) => [r.student_id, PROBATION_STATUS_LABELS[r.probation_status] || ACADEMIC_STANDING.NONE])
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