/**
 * ============================================================================
 * GradeManageModel
 * ============================================================================
 * Data access layer for viewing and recording student grades.
 *
 * A student's "grade sheet" is assembled from three tables:
 *
 *   1. curriculum_courses  -> the fixed list of courses a curriculum requires,
 *                             organized by year_level + semester_id (term type,
 *                             e.g. 1st Sem / 2nd Sem / Summer).
 *   2. grades               -> the recorded outcome for a specific
 *                             (student, course, academic_year, term) combo.
 *   3. grade_components     -> the Prelim / Midterm / Final breakdown that
 *                             produced a grades.final_grade value.
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

/** Percentage threshold below which a student fails outright (grade point 5.00). */
const PASSING_SCORE = 75;

/**
 * The Philippine-style 1.00–5.00 grade point scale, derived from a
 * composite percentage score. Every 3 percentage points below 100 steps
 * the grade point down by 0.25, until it bottoms out at 3.00 (the lowest
 * passing point, corresponding to the 75 floor). Anything below 75 is a
 * flat 5.00 (failed) — it does not continue stepping past 3.00.
 *
 * e.g. 98-100 -> 1.00, 95-97 -> 1.25, 92-94 -> 1.50 ... 75-76 -> 3.00, <75 -> 5.00
 */
const HIGHEST_GRADE_POINT = 1.0;
const LOWEST_PASSING_GRADE_POINT = 3.0;
const FAILING_GRADE_POINT = 5.0;
const GRADE_POINT_STEP = 0.25;
const PERCENTAGE_STEP = 3;

/**
 * Standard term weighting used to compute a course's final grade from its
 * Prelim / Midterm / Final scores. Centralized here so the institution's
 * weighting policy only needs to change in one place.
 */
const TERM_WEIGHTS = {
  Prelim: 30,
  Midterm: 30,
  Final: 40
};

/**
 * Academic standing tiers, derived from a student's failed-grade history.
 * Mirrors the enum used by student_status.probation_status, except 'None'
 * is displayed as 'Regular' to match how the masterlist presents it.
 */
const ACADEMIC_STANDING = {
  REGULAR: 'Regular',
  WARNING: 'Warning',
  PROBATIONARY_1: 'Probationary 1',
  PROBATIONARY_2: 'Probationary 2'
};

/** Maps the raw student_status.probation_status enum value to a display label. */
const PROBATION_STATUS_LABELS = {
  None: ACADEMIC_STANDING.REGULAR,
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
   * any grade + grade_components already on file.
   *
   * @param {number} studentId
   * @returns {Promise<object|null>} null if the student has no enrollment
   *   record (and therefore no curriculum to build a grade sheet from).
   */
  static async getGradeSheet(studentId) {
    const context = await this.getStudentCurriculumContext(studentId);
    if (!context) return null;

    const { curriculum_id, current_year_level, program_name, program_abbr, total_year } = context;

    // 1. Every course required by this curriculum.
    const coursesRes = await db.query(`
      SELECT 
        cc.year_level,
        cc.semester_id,
        sem.semester_label,
        co.course_id,
        co.course_code,
        co.course_name,
        co.total_units
      FROM curriculum_courses cc
      JOIN courses co ON co.course_id = cc.course_id
      JOIN semester sem ON sem.semester_id = cc.semester_id
      WHERE cc.curriculum_id = $1
      ORDER BY cc.year_level ASC, cc.semester_id ASC, co.course_code ASC
    `, [curriculum_id]);

    // 2. Every grade (and its term components) already recorded for this student.
    const gradesRes = await db.query(`
      SELECT 
        g.grade_id,
        g.course_id,
        g.year_id,
        g.semester_id,
        g.final_grade,
        g.remarks,
        gc.term,
        gc.score
      FROM grades g
      LEFT JOIN grade_components gc ON gc.grade_id = g.grade_id
      WHERE g.student_id = $1
    `, [studentId]);

    // Index existing grades by course_id for O(1) lookup while merging below.
    const gradesByCourse = new Map();
    for (const row of gradesRes.rows) {
      if (!gradesByCourse.has(row.course_id)) {
        gradesByCourse.set(row.course_id, {
          gradeId: row.grade_id,
          yearId: row.year_id,
          semesterId: row.semester_id,
          finalGrade: row.final_grade,
          remarks: row.remarks,
          components: {}
        });
      }
      if (row.term) {
        gradesByCourse.get(row.course_id).components[row.term] = row.score;
      }
    }

    // 3. Group courses -> year level -> semester, attaching grade data to each.
    const yearMap = new Map();
    for (const c of coursesRes.rows) {
      if (!yearMap.has(c.year_level)) yearMap.set(c.year_level, new Map());
      const semMap = yearMap.get(c.year_level);

      if (!semMap.has(c.semester_id)) {
        semMap.set(c.semester_id, {
          semesterId: c.semester_id,
          semesterLabel: c.semester_label,
          courses: []
        });
      }

      const existing = gradesByCourse.get(c.course_id) || null;
      semMap.get(c.semester_id).courses.push({
        courseId: c.course_id,
        courseCode: c.course_code,
        courseName: c.course_name,
        units: c.total_units,
        gradeId: existing?.gradeId || null,
        finalGrade: existing?.finalGrade ?? null,
        remarks: existing?.remarks || null,
        prelim: existing?.components?.Prelim ?? '',
        midterm: existing?.components?.Midterm ?? '',
        final: existing?.components?.Final ?? ''
      });
    }

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
      termWeights: TERM_WEIGHTS,
      gradeScale: {
        passingPercentage: PASSING_SCORE,
        highestPoint: HIGHEST_GRADE_POINT,
        lowestPassingPoint: LOWEST_PASSING_GRADE_POINT,
        failingPoint: FAILING_GRADE_POINT,
        pointStep: GRADE_POINT_STEP,
        percentageStep: PERCENTAGE_STEP
      },
      years
    };
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
   * Converts a composite percentage score (0-100) into its 1.00-5.00
   * grade point equivalent. Below the passing percentage, the result is
   * always the flat failing point — it does not keep stepping past 3.00.
   *
   * @returns {number} a value between HIGHEST_GRADE_POINT and FAILING_GRADE_POINT.
   */
  static percentageToGradePoint(percentage) {
    if (percentage < PASSING_SCORE) return FAILING_GRADE_POINT;

    const steps = Math.floor((100 - percentage) / PERCENTAGE_STEP);
    const gradePoint = HIGHEST_GRADE_POINT + GRADE_POINT_STEP * steps;

    // Safety clamp: composite percentages can't fall below PASSING_SCORE
    // here (that branch is handled above), so this never actually exceeds
    // LOWEST_PASSING_GRADE_POINT in practice — kept for defensiveness.
    return Math.min(gradePoint, LOWEST_PASSING_GRADE_POINT);
  }

  /**
   * Computes a course's final grade point and pass/fail remark from its
   * three term scores. A term only counts as "provided" if it is a finite
   * number. Incomplete sets of scores yield an 'INC' remark and a null
   * final grade; complete sets are weighted into a composite percentage,
   * then converted to the 1.00-5.00 grade point scale.
   *
   * @returns {{ finalGrade: number|null, remarks: 'P'|'F'|'INC' }}
   */
  static computeFinalGrade({ prelim, midterm, final }) {
    const scores = { Prelim: prelim, Midterm: midterm, Final: final };
    const provided = Object.entries(scores).filter(
      ([, v]) => v !== null && v !== '' && v !== undefined && Number.isFinite(Number(v))
    );

    if (provided.length < 3) {
      return { finalGrade: null, remarks: 'INC' };
    }

    let weightedSum = 0;
    for (const [term, value] of provided) {
      weightedSum += (Number(value) * TERM_WEIGHTS[term]) / 100;
    }

    const percentage = Math.round(weightedSum * 100) / 100;
    const finalGrade = this.percentageToGradePoint(percentage);
    const remarks = finalGrade === FAILING_GRADE_POINT ? 'F' : 'P';
    return { finalGrade, remarks };
  }

  /**
   * Persists a batch of grade entries for a student inside a single
   * transaction — either the whole batch succeeds or none of it does.
   *
   * @param {number} studentId
   * @param {number|null} facultyId - id of the recorder, if applicable.
   * @param {Array<{
   *   courseId: number,
   *   yearLevel: number,
   *   semesterId: number,
   *   prelim: number|string,
   *   midterm: number|string,
   *   final: number|string
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
        const { courseId, yearLevel, semesterId, prelim, midterm, final } = entry;

        if (!courseId || !yearLevel || !semesterId) {
          throw new Error(`Incomplete grade entry: course, year level, and semester are required.`);
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

        const { finalGrade, remarks } = this.computeFinalGrade({ prelim, midterm, final });

        // Upsert the grade header row for this (student, course, year, term).
        const gradeRes = await client.query(`
          INSERT INTO grades (student_id, course_id, year_id, semester_id, faculty_id, final_grade, remarks, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (student_id, course_id, year_id, semester_id) DO UPDATE SET
            faculty_id = EXCLUDED.faculty_id,
            final_grade = EXCLUDED.final_grade,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING grade_id
        `, [studentId, courseId, year_id, semester_id, facultyId || null, finalGrade, remarks]);

        const gradeId = gradeRes.rows[0].grade_id;

        // Replace the term components wholesale — simpler and safer than
        // diffing three rows per course on every save.
        await client.query(`DELETE FROM grade_components WHERE grade_id = $1`, [gradeId]);

        const termValues = { Prelim: prelim, Midterm: midterm, Final: final };
        for (const [term, score] of Object.entries(termValues)) {
          if (score === '' || score === null || score === undefined) continue;
          await client.query(`
            INSERT INTO grade_components (grade_id, term, component_name, score, percentage)
            VALUES ($1, $2, $3, $4, $5)
          `, [gradeId, term, term, Number(score), TERM_WEIGHTS[term]]);
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
      overrideRes.rows.map((r) => [r.student_id, PROBATION_STATUS_LABELS[r.probation_status] || ACADEMIC_STANDING.REGULAR])
    );

    const standingMap = new Map();
    for (const row of aggRes.rows) {
      const override = overrides.get(row.student_id);
      if (override) {
        standingMap.set(row.student_id, { status: override, isOverridden: true });
        continue;
      }

      const { max_course_repeat, max_semester_fails, total_courses_failed } = row;
      let status = ACADEMIC_STANDING.REGULAR;

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