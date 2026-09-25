/**
 * ============================================================================
 * GradeManageModel
 * ============================================================================
 * Data access layer for viewing and recording student grades.
 *
 * A student's "grade sheet" is assembled from five tables:
 *
 *   1. curriculum_courses    -> the fixed list of courses a curriculum
 *                               requires, organized by year_level +
 *                               semester_id (term type).
 *   2. courses               -> lec_units/lab_units/grading_scheme, which
 *                               determine a course's grading category
 *                               (see GradingEngine.getCourseCategory).
 *   3. grades                -> the recorded outcome for a specific
 *                               (student, course, academic_year, term)
 *                               combo. Also stores year_level so retakes
 *                               placed in a later year stay distinct.
 *   4. grade_components      -> named sub-scores per term (Quizzes/AT,
 *                               Prelim/Midterm/Final Exam, Unit Practical
 *                               Exam, OSCE/OSPE, etc.).
 *   5. grade_prereq_overrides -> which prerequisite courses were missing
 *                               when a grade was saved with an override.
 *                               One row per (grade, missing prereq).
 *                               Audit detail (who/when) lives in history_logs.
 * ============================================================================
 */

const db = require('../config/db');
const GradingEngine = require('./gradingEngine');
const HistoryModel = require('./historyModel');

const ACADEMIC_STANDING = {
  NONE: 'None',
  WARNING: 'Warning',
  PROBATIONARY_1: 'Probationary 1',
  PROBATIONARY_2: 'Probationary 2'
};

const PROBATION_STATUS_LABELS = {
  None: ACADEMIC_STANDING.NONE,
  Warning: ACADEMIC_STANDING.WARNING,
  'Probationary 1': ACADEMIC_STANDING.PROBATIONARY_1,
  'Probationary 2': ACADEMIC_STANDING.PROBATIONARY_2
};

class GradeManageModel {

  static async getActiveAcademicTerm(client = db) {
    const res = await client.query(`
      SELECT year_id, current_sem AS semester_id
      FROM academic_year
      WHERE is_active = true
      LIMIT 1
    `);
    return res.rows[0] || { year_id: null, semester_id: null };
  }

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
   * Map of course_id → year_level for every course in the student's
   * active curriculum. Only courses in the curriculum are present.
   * If a course appears in multiple curriculum slots, the earliest year
   * level wins.
   */
  static async getCurriculumYearLevelMap(studentId) {
    const ctx = await this.getStudentCurriculumContext(studentId);
    if (!ctx || !ctx.curriculum_id) return new Map();

    const res = await db.query(`
      SELECT course_id, MIN(year_level)::int AS year_level
      FROM curriculum_courses
      WHERE curriculum_id = $1
      GROUP BY course_id
    `, [ctx.curriculum_id]);

    return new Map(res.rows.map((r) => [r.course_id, Number(r.year_level)]));
  }

  /**
   * Map of course_id → bool, true when the student's LATEST attempt at
   * that course has remarks = 'P'. Courses with no attempt are absent.
   */
  static async getCoursePassedMap(studentId) {
    const res = await db.query(`
      SELECT DISTINCT ON (course_id)
        course_id, remarks
      FROM grades
      WHERE student_id = $1
      ORDER BY course_id, year_level DESC, semester_id DESC
    `, [studentId]);

    const map = new Map();
    for (const r of res.rows) {
      map.set(r.course_id, r.remarks === 'P');
    }
    return map;
  }

  /**
   * For a set of course IDs, returns a Map keyed by course_id:
   *   { eligible: bool, missing: [code, ...], missingIds: [id, ...] }
   *
   * "Eligible" = the student has a PASSING grade (remarks = 'P') in every
   * prerequisite of the course. Uses the LATEST attempt per prerequisite
   * course, so a retake pass overrides an original fail.
   *
   * Prerequisites are stored on courses.prerequisites as a comma-separated
   * string of course IDs (e.g. "12,10,16").
   */
  static async checkPrerequisiteEligibility(studentId, courseIds) {
    if (!courseIds || courseIds.length === 0) return new Map();

    const courseRes = await db.query(`
      SELECT course_id, course_code, prerequisites
      FROM courses
      WHERE course_id = ANY($1::int[])
    `, [courseIds]);

    const allCodesRes = await db.query(`SELECT course_id, course_code FROM courses`);
    const codeById = new Map(allCodesRes.rows.map((r) => [String(r.course_id), r.course_code]));

    const prereqIds = new Set();
    for (const c of courseRes.rows) {
      const str = (c.prerequisites || '').trim();
      if (!str) continue;
      for (const tok of str.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (/^\d+$/.test(tok)) prereqIds.add(Number(tok));
      }
    }

    const passedSet = new Set();
    if (prereqIds.size > 0) {
      const gradeRes = await db.query(`
        SELECT DISTINCT ON (course_id)
          course_id, remarks
        FROM grades
        WHERE student_id = $1 AND course_id = ANY($2::int[])
        ORDER BY course_id, year_level DESC, semester_id DESC
      `, [studentId, [...prereqIds]]);
      for (const g of gradeRes.rows) {
        if (g.remarks === 'P') passedSet.add(g.course_id);
      }
    }

    const result = new Map();
    for (const c of courseRes.rows) {
      const str = (c.prerequisites || '').trim();
      if (!str) {
        result.set(c.course_id, { eligible: true, missing: [], missingIds: [] });
        continue;
      }

      const tokens = str.split(',').map((s) => s.trim()).filter(Boolean);
      const missing = [];
      const missingIds = [];
      for (const tok of tokens) {
        if (/^\d+$/.test(tok)) {
          const id = Number(tok);
          if (!passedSet.has(id)) {
            missing.push(codeById.get(tok) || `#${tok}`);
            missingIds.push(id);
          }
        }
      }

      result.set(c.course_id, {
        eligible: missing.length === 0,
        missing,
        missingIds
      });
    }
    return result;
  }

  static async getGradeSheet(studentId) {
    const context = await this.getStudentCurriculumContext(studentId);
    if (!context) return null;

    const { curriculum_id, current_year_level, program_name, program_abbr, total_year } = context;

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

    // Prerequisite eligibility for every course that will appear.
    const allCourseIds = new Set(coursesRes.rows.map((c) => c.course_id));
    for (const cid of attemptsByCourse.keys()) allCourseIds.add(cid);
    const eligibilityMap = await this.checkPrerequisiteEligibility(
      studentId,
      [...allCourseIds]
    );

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

    const buildCourseRow = (courseMeta, attempt, allAttempts) => {
      const category = GradingEngine.getCourseCategory(courseMeta);
      const scoresByTerm = attempt?.scoresByTerm || { Prelim: {}, Midterm: {}, Final: {} };
      const cumulative = attempt
        ? GradingEngine.computeCumulativeGrade(courseMeta, scoresByTerm)
        : { finalGrade: null, remarks: null };

      const eligibility = eligibilityMap.get(courseMeta.course_id)
        || { eligible: true, missing: [], missingIds: [] };

      return {
        courseId: courseMeta.course_id,
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

    // Pass 1 — curriculum slots.
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

    // Pass 2 — retakes outside their native curriculum slot.
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

  static async saveGrades(studentId, facultyId, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('No grade entries provided.');
    }

    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      for (const entry of entries) {
        const { courseId, yearLevel, semesterId, scoresByTerm, missingPrereqs } = entry;

        if (!courseId || !yearLevel || !semesterId || !scoresByTerm) {
          throw new Error('Incomplete grade entry: course, year level, semester, and scores are required.');
        }

        const courseRes = await client.query(`
          SELECT course_id, lab_units, grading_scheme FROM courses WHERE course_id = $1
        `, [courseId]);

        if (courseRes.rows.length === 0) {
          throw new Error(`Course ${courseId} not found.`);
        }
        const course = courseRes.rows[0];
        const category = GradingEngine.getCourseCategory(course);

        // Guard: reject grades for year levels the student hasn't reached.
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

        // Wipe + rewrite prereq override rows for this grade.
        await client.query(
          `DELETE FROM grade_prereq_overrides WHERE grade_id = $1`,
          [gradeId]
        );

        if (Array.isArray(missingPrereqs) && missingPrereqs.length > 0) {
          for (const missingCourseId of missingPrereqs) {
            await client.query(`
              INSERT INTO grade_prereq_overrides (grade_id, missing_prereq_course_id)
              VALUES ($1, $2)
            `, [gradeId, missingCourseId]);
          }

          const codesRes = await client.query(
            `SELECT course_id, course_code FROM courses WHERE course_id = ANY($1::int[])`,
            [missingPrereqs]
          );
          const codeMap = new Map(codesRes.rows.map((r) => [r.course_id, r.course_code]));

          const courseRes2 = await client.query(
            `SELECT course_code FROM courses WHERE course_id = $1`,
            [courseId]
          );

          await HistoryModel.log({
            userId: facultyId || null,
            targetUserId: null,
            tableName: 'grades',
            recordId: gradeId,
            action: 'PREREQ_OVERRIDE',
            oldValues: null,
            newValues: {
              student_id: studentId,
              course_id: courseId,
              course_code: courseRes2.rows[0]?.course_code || null,
              year_level: Number(yearLevel),
              semester_id: semester_id,
              missing_prereq_ids: missingPrereqs,
              missing_prereqs: missingPrereqs.map((id) => codeMap.get(id) || `#${id}`),
              timestamp: new Date().toISOString()
            },
            ipAddress: null,
            userAgent: null
          });
        }

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

  static async getAcademicStandingMap() {
    const aggRes = await db.query(`
      WITH course_repeats AS (
        SELECT student_id, course_id, COUNT(*)::int AS times_failed
        FROM grades
        WHERE remarks = 'F'
        GROUP BY student_id, course_id
      ),
      semester_fails AS (
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