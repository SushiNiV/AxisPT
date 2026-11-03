/**
 * ============================================================================
 * GradeManageModel
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

  static async getCoursePassedMap(studentId) {
    const res = await db.query(`
      SELECT DISTINCT ON (course_id)
        course_id, remarks
      FROM grades
      WHERE student_id = $1 AND archived_at IS NULL
      ORDER BY course_id, year_level DESC, semester_id DESC
    `, [studentId]);

    const map = new Map();
    for (const r of res.rows) {
      map.set(r.course_id, r.remarks === 'P');
    }
    return map;
  }

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
        WHERE student_id = $1 AND course_id = ANY($2::int[]) AND archived_at IS NULL
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

    // FIX: Direct assignment instead of destructuring to match the return object
    const curriculumId = context.curriculum_id;
    const currentYearLevel = context.current_year_level;
    const programName = context.program_name;
    const programAbbr = context.program_abbr;
    const totalYear = context.total_year;

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
    `, [curriculumId]);

    const gradesRes = await db.query(`
      SELECT 
        g.grade_id,
        g.course_id,
        g.year_id,
        g.semester_id,
        g.year_level,
        g.final_grade,
        g.remarks,
        g.prelim_raw, g.prelim_transmuted,
        g.midterm_raw, g.midterm_transmuted,
        g.final_raw, g.final_transmuted,
        gc.term,
        gc.component_name,
        gc.score
      FROM grades g
      LEFT JOIN grade_components gc ON gc.grade_id = g.grade_id
      WHERE g.student_id = $1 AND g.archived_at IS NULL
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
          prelim_raw: row.prelim_raw, prelim_transmuted: row.prelim_transmuted,
          midterm_raw: row.midterm_raw, midterm_transmuted: row.midterm_transmuted,
          final_raw: row.final_raw, final_transmuted: row.final_transmuted,
          scoresByTerm: { Prelim: {}, Midterm: {}, Final: {} }
        };
        attempts.push(attempt);
      }
      if (row.term && row.component_name) {
        attempt.scoresByTerm[row.term][row.component_name] = row.score;
      }
    }

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
      curriculumId,
      programName,
      programAbbr,
      totalYears: totalYear,
      currentYearLevel,
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
        const {
          courseId, yearLevel, semesterId, scoresByTerm, missingPrereqs,
          prelim_raw, prelim_transmuted, midterm_raw, midterm_transmuted,
          final_raw, final_transmuted, remarks: manualRemarks
        } = entry;
        const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

        // Validate manual grades before touching the database.
        // Keep in sync with the DB check constraints and RULES in AddGrade.js.
        const RANGES = { raw: [60, 100], transmuted: [60, 100] };
        const checkGrade = (kind, value, label) => {
          if (value === null || value === undefined || value === '') return;
          const n = Number(value);
          const [min, max] = RANGES[kind];
          if (!Number.isFinite(n) || n < min || n > max) {
            throw new Error(`${label} must be between ${min} and ${max}.`);
          }
        };
        checkGrade('raw', prelim_raw, 'Prelim raw');
        checkGrade('transmuted', prelim_transmuted, 'Prelim transmuted');
        checkGrade('raw', midterm_raw, 'Midterm raw');
        checkGrade('transmuted', midterm_transmuted, 'Midterm transmuted');
        checkGrade('raw', final_raw, 'Final raw');
        checkGrade('transmuted', final_transmuted, 'Final transmuted');

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

        const { finalGrade, remarks: computedRemarks } = GradingEngine.computeCumulativeGrade(course, scoresByTerm);
        // A remark picked manually in the UI wins over the computed one.
        const remarks = manualRemarks || computedRemarks;

        const gradeRes = await client.query(`
          INSERT INTO grades (student_id, course_id, year_id, semester_id, year_level, faculty_id, final_grade, remarks,
                              prelim_raw, prelim_transmuted, midterm_raw, midterm_transmuted, final_raw, final_transmuted, updated_at)
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
          RETURNING grade_id
        `, [
          studentId, courseId, year_id, semester_id, Number(yearLevel), facultyId || null, finalGrade, remarks,
          num(prelim_raw), num(prelim_transmuted), num(midterm_raw), num(midterm_transmuted), num(final_raw), num(final_transmuted)
        ]);

        const gradeId = gradeRes.rows[0].grade_id;

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
  
  static async deleteEmptyAssignment(studentId, courseId, yearLevel, semesterId) {
    const res = await db.query(`
      DELETE FROM grades g
      WHERE g.student_id = $1 
        AND g.course_id = $2 
        AND g.year_level = $3 
        AND g.semester_id = $4
        AND NOT EXISTS (
          SELECT 1 FROM grade_components gc WHERE gc.grade_id = g.grade_id
        )
      RETURNING g.grade_id
    `, [studentId, courseId, yearLevel, semesterId]);
    
    return res.rowCount > 0;
  }

  static async archiveGradeById(gradeId, { reason, facultyId }) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is required to archive a grade.');
    }

    const res = await db.query(`
      UPDATE grades
      SET archived_at = NOW(),
          archive_reason = $2,
          updated_at = NOW()
      WHERE grade_id = $1 AND archived_at IS NULL
      RETURNING grade_id, student_id, course_id, year_level, semester_id
    `, [gradeId, reason.trim()]);

    if (res.rowCount === 0) {
      throw new Error('Grade not found or already archived.');
    }

    const row = res.rows[0];

    const courseRes = await db.query(
      `SELECT course_code FROM courses WHERE course_id = $1`,
      [row.course_id]
    );

    await HistoryModel.log({
      userId: facultyId || null,
      targetUserId: null,
      tableName: 'grades',
      recordId: gradeId,
      action: 'GRADE_ARCHIVED',
      oldValues: null,
      newValues: {
        student_id: row.student_id,
        course_id: row.course_id,
        course_code: courseRes.rows[0]?.course_code || null,
        year_level: row.year_level,
        semester_id: row.semester_id,
        reason: reason.trim(),
        timestamp: new Date().toISOString()
      },
      ipAddress: null,
      userAgent: null
    });

    return gradeId;
  }

  static async getArchivedGradesForStudent(studentId) {
    const res = await db.query(`
      SELECT 
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
      ORDER BY g.archived_at DESC
    `, [studentId]);

    return res.rows.map(r => ({
      gradeId: r.grade_id,
      courseId: r.course_id,
      courseCode: r.course_code,
      courseName: r.course_name,
      yearLevel: Number(r.year_level),
      semesterId: r.semester_id,
      semesterLabel: r.semester_label,
      archivedAt: r.archived_at,
      archiveReason: r.archive_reason
    }));
  }

  static async restoreGradeById(gradeId, { facultyId }) {
    const res = await db.query(`
      UPDATE grades
      SET archived_at = NULL,
          archive_reason = NULL,
          updated_at = NOW()
      WHERE grade_id = $1 AND archived_at IS NOT NULL
      RETURNING grade_id, student_id, course_id, year_level, semester_id
    `, [gradeId]);

    if (res.rowCount === 0) {
      throw new Error('Grade not found or is not archived.');
    }

    const row = res.rows[0];

    const courseRes = await db.query(
      `SELECT course_code FROM courses WHERE course_id = $1`,
      [row.course_id]
    );

    await HistoryModel.log({
      userId: facultyId || null,
      targetUserId: null,
      tableName: 'grades',
      recordId: gradeId,
      action: 'GRADE_RESTORED',
      oldValues: null,
      newValues: {
        student_id: row.student_id,
        course_id: row.course_id,
        course_code: courseRes.rows[0]?.course_code || null,
        year_level: row.year_level,
        semester_id: row.semester_id,
        timestamp: new Date().toISOString()
      },
      ipAddress: null,
      userAgent: null
    });

    return gradeId;
  }

  static async getAcademicStandingMap() {
    const aggRes = await db.query(`
      WITH course_repeats AS (
        SELECT student_id, course_id, COUNT(*)::int AS times_failed
        FROM grades
        WHERE remarks = 'F' AND archived_at IS NULL
        GROUP BY student_id, course_id
      ),
      semester_fails AS (
        SELECT student_id, year_id, semester_id, COUNT(DISTINCT course_id)::int AS courses_failed
        FROM grades
        WHERE remarks = 'F' AND archived_at IS NULL
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
      JOIN academic_year ay ON ay.year_id = ss.year_id
        AND ay.is_active = true
        AND ss.semester_id = ay.current_sem
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