/**
 * seedGrades.js
 * -----------------------------------------------------------------------------
 * One-off script to populate dummy grade data for every student, every course
 * in their curriculum. Uses GradingEngine.getEnterableFields() so the shape
 * of each entry matches exactly what AddGrade.js would submit, and reuses
 * GradeManageModel.saveGrades() so final_grade/remarks are computed by the
 * same code path the real app uses.
 *
 * Fail rate is set by FAIL_RATE — approximately that fraction of courses
 * per student are seeded with scores in the failing band, the rest in a
 * comfortably-passing band.
 * -----------------------------------------------------------------------------
 */

require('dotenv').config();
const db = require('./config/db');
const GradeManageModel = require('./models/grademanageModel');
const GradingEngine = require('./models/gradingEngine');
const FAIL_RATE = 0.15;         // ~15% of courses fail
const PASS_BAND = [85, 97];     // composite target for passing courses
const FAIL_BAND = [60, 73];     // composite target for failing courses
const TERMS = ['Prelim', 'Midterm', 'Final'];

/** Random integer in [min, max] inclusive. */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Given a course's enterable fields, generate a scoresByTerm object whose
 * component scores land the cumulative grade near `targetComposite`. Uses
 * jitter so numbers don't look synthetic.
 */
function generateScoresForCourse(course, targetComposite) {
  const fields = GradingEngine.getEnterableFields(course);
  const jitter = () => randInt(-3, 3);

  const scoresByTerm = { Prelim: {}, Midterm: {}, Final: {} };

  for (const field of fields) {
    const value = Math.max(0, Math.min(100, targetComposite + jitter()));
    if (field.term === null) {
      // spansAllTerms — write it to every term (engine will average them)
      for (const t of TERMS) {
        scoresByTerm[t][field.component] = value;
      }
    } else {
      scoresByTerm[field.term][field.component] = value;
    }
  }

  return scoresByTerm;
}

async function main() {
  try {
    console.log('Fetching students + their curricula...');
    const studentsRes = await db.query(`
      SELECT s.student_id,
             COALESCE(se_current.curriculum_id, se_recent.curriculum_id) AS curriculum_id
      FROM students s
      LEFT JOIN student_education se_current
        ON se_current.student_id = s.student_id AND se_current.is_current = true
      LEFT JOIN LATERAL (
        SELECT curriculum_id
        FROM student_education
        WHERE student_id = s.student_id
        ORDER BY education_id DESC
        LIMIT 1
      ) se_recent ON true
      WHERE COALESCE(se_current.curriculum_id, se_recent.curriculum_id) IS NOT NULL
    `);

    const students = studentsRes.rows;
    console.log(`  ${students.length} students with a curriculum`);

    console.log('Fetching active faculty for round-robin...');
    const facultyRes = await db.query(`
      SELECT faculty_id FROM faculties WHERE account_status = true ORDER BY faculty_id
    `);
    const facultyIds = facultyRes.rows.map((r) => r.faculty_id);
    if (facultyIds.length === 0) {
      throw new Error('No active faculty found — cannot assign grade recorders.');
    }
    console.log(`  ${facultyIds.length} active faculty`);

    // Group curricula -> courses to avoid fetching the same curriculum's
    // course list multiple times.
    const curriculumIds = [...new Set(students.map((s) => s.curriculum_id))];
    console.log(`Fetching course lists for ${curriculumIds.length} curricula...`);

    const coursesByCurriculum = new Map();
    const coursesRes = await db.query(`
      SELECT cc.curriculum_id,
             co.course_id,
             co.course_code,
             co.lab_units,
             co.grading_scheme
      FROM curriculum_courses cc
      JOIN courses co ON co.course_id = cc.course_id
      WHERE cc.curriculum_id = ANY($1::int[])
    `, [curriculumIds]);

    for (const row of coursesRes.rows) {
      if (!coursesByCurriculum.has(row.curriculum_id)) {
        coursesByCurriculum.set(row.curriculum_id, []);
      }
      coursesByCurriculum.get(row.curriculum_id).push(row);
    }

    const totalCourses = [...coursesByCurriculum.values()].reduce((s, a) => s + a.length, 0);
    console.log(`  ${totalCourses} total course assignments across all curricula`);

    let processed = 0;
    let failedCount = 0;
    let errors = 0;
    const startTime = Date.now();

    for (const student of students) {
      const courses = coursesByCurriculum.get(student.curriculum_id) || [];

      for (const course of courses) {
        const shouldFail = Math.random() < FAIL_RATE;
        const band = shouldFail ? FAIL_BAND : PASS_BAND;
        const target = randInt(band[0], band[1]);

        const scoresByTerm = generateScoresForCourse(course, target);

        // We pass yearLevel + semesterId 1 so resolveAcademicPeriod anchors
        // to the student's Y1/S1 enrollment. If they don't have one, it
        // falls back to the active academic year — same as the real flow.
        const entry = {
          courseId: course.course_id,
          yearLevel: 1,
          semesterId: 1,
          scoresByTerm
        };

        const facultyId = facultyIds[student.student_id % facultyIds.length];

        try {
          await GradeManageModel.saveGrades(student.student_id, facultyId, [entry]);
          processed++;
          if (shouldFail) failedCount++;
        } catch (err) {
          errors++;
          console.error(
            `  ✗ student ${student.student_id} / course ${course.course_code}:`,
            err.message
          );
        }
      }

      if (processed % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`  ... ${processed} grades saved (${elapsed}s)\r`);
      }
    }

    console.log('\nDone.');
    console.log(`  Grades saved:  ${processed}`);
    console.log(`  Fail-band seeds: ${failedCount}  (~${((failedCount / processed) * 100).toFixed(1)}%)`);
    console.log(`  Errors:        ${errors}`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();