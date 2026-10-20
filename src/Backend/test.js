const db = require('./config/db');

// Helper function to generate realistic component scores based on lab_units
function generateComponents(labUnits) {
  const hasLab = labUnits > 0;

  const baseComponents = [
    { term: 'Prelim', name: 'Quizzes/AT', score: 85, pct: 24 },
    { term: 'Prelim', name: 'Prelim Exam', score: 88, pct: 12 },
    { term: 'Midterm', name: 'Quizzes/AT', score: 90, pct: 24 },
    { term: 'Midterm', name: 'Midterm Exam', score: 86, pct: 12 },
    { term: 'Final', name: 'Quizzes/AT', score: 89, pct: 24 },
    { term: 'Final', name: 'Final Exam', score: 92, pct: 12 },
  ];

  if (hasLab) {
    // Add the lab-specific components for courses with labs
    baseComponents.push(
      { term: 'Prelim', name: 'Unit Practical Exam', score: 87, pct: 16 },
      { term: 'Prelim', name: 'Prelim OSCE/OSPE', score: 89, pct: 8 },
      { term: 'Midterm', name: 'Unit Practical Exam', score: 85, pct: 16 },
      { term: 'Midterm', name: 'Midterm OSCE/OSPE', score: 88, pct: 8 },
      { term: 'Final', name: 'Unit Practical Exam', score: 90, pct: 16 },
      { term: 'Final', name: 'Final OSCE/OSPE', score: 91, pct: 8 }
    );
  }

  return baseComponents;
}

async function seedGradesForStudent() {
  const client = await db.connect();

  try {
    console.log('🔄 Starting full-year grade generation...');
    
    // Target the student we just created
    const studentNumber = '01230002183'; 

    // 1. Get the student and their active curriculum/term
    const studentRes = await client.query(`
      SELECT s.student_id, se.curriculum_id, se.year_level, se.year_id
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
      WHERE u.username = $1
    `, [studentNumber]);

    if (studentRes.rows.length === 0) {
      throw new Error(`Student ${studentNumber} or their active education record not found.`);
    }

    const { student_id, curriculum_id, year_level, year_id } = studentRes.rows[0];
    
    const facultyRes = await client.query(`SELECT faculty_id FROM faculties LIMIT 1`);
    const faculty_id = facultyRes.rows[0]?.faculty_id || null;

    console.log(`Found student ID: ${student_id} | Curriculum: ${curriculum_id} | Year Level: ${year_level}`);

    await client.query('BEGIN');

    const semesters = [1, 2, 3];

    for (const semester_id of semesters) {
      // Get the courses AND their lab_units for this semester
      const coursesRes = await client.query(`
        SELECT c.course_id, c.course_code, c.course_name, c.lab_units
        FROM curriculum_courses cc
        JOIN courses c ON c.course_id = cc.course_id
        WHERE cc.curriculum_id = $1 
          AND cc.year_level = $2 
          AND cc.semester_id = $3
      `, [curriculum_id, year_level, semester_id]);

      if (coursesRes.rows.length === 0) {
        console.log(`⏭️ No courses found for Semester ${semester_id}. Skipping.`);
        continue;
      }

      console.log(`\n📚 Generating grades for Semester ${semester_id}...`);

      for (const course of coursesRes.rows) {
        const randomGrade = (Math.random() * 2 + 1).toFixed(2); 
        
        const gradeRes = await client.query(`
          INSERT INTO grades (
            student_id, course_id, year_id, semester_id, year_level, faculty_id, final_grade, remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'P')
          ON CONFLICT (student_id, course_id, year_id, semester_id, year_level) 
          DO UPDATE SET final_grade = EXCLUDED.final_grade, remarks = EXCLUDED.remarks
          RETURNING grade_id
        `, [student_id, course.course_id, year_id, semester_id, year_level, faculty_id, randomGrade]);

        const gradeId = gradeRes.rows[0].grade_id;

        // Generate correct components based on lab_units
        const components = generateComponents(course.lab_units);

        await client.query(`DELETE FROM grade_components WHERE grade_id = $1`, [gradeId]);

        for (const comp of components) {
          await client.query(`
            INSERT INTO grade_components (grade_id, term, component_name, score, percentage)
            VALUES ($1, $2, $3, $4, $5)
          `, [gradeId, comp.term, comp.name, comp.score, comp.pct]);
        }

        const labText = course.lab_units > 0 ? '(with Lab)' : '';
        console.log(`  ✅ ${course.course_code} ${labText}: ${randomGrade}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 Successfully seeded grades for the entire year!');
    process.exit(0);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding grades:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedGradesForStudent();