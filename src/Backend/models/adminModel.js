const db = require('../config/db');
const pool = db.newPool;

const Admin = {
  
  findById: async (username) => {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.password_hash, u.changed_pass, r.role_name 
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.username = $1 AND r.role_name = 'Admin'`, 
    [username]
  );
  return result.rows[0];
},

findByUserId: async (userId) => {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.password_hash, u.changed_pass, r.role_name 
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE u.user_id = $1`, 
    [userId]
  );
  return result.rows[0];
},

 getPending: async () => {
  const result = await pool.query(`
    SELECT 
      s.student_id,
      u.username as student_id,  
      s.account_status,
      s.created_at,
      pii.first_name as firstname,
      pii.last_name as lastname,
      pii.middle_name as middlename,
      pii.personal_email as email,
      pii.mobile_no,
      edu.year_level,
      edu.classification,
      p.program_abbr as program,
      sec.section_name as section
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN student_pii pii ON s.student_id = pii.student_id
    LEFT JOIN student_education edu ON s.student_id = edu.student_id
    LEFT JOIN curricula c ON edu.curriculum_id = c.curriculum_id
    LEFT JOIN programs p ON c.program_id = p.program_id
    LEFT JOIN section_assignments sa ON edu.assignment_id = sa.assignment_id
    LEFT JOIN sections sec ON sa.section_id = sec.section_id
    WHERE s.account_status = false 
    ORDER BY s.created_at DESC
  `);
  return result.rows;
},

  getMasterlist: async () => {
      const result = await pool.query(`
        SELECT 
          u.username as id,
          s.account_status,
          pii.first_name || ' ' || pii.last_name as name, 
          p.program_abbr as program, 
          edu.year_level as year,
          sec.section_name as block,
          CASE 
            WHEN s.account_status = true THEN 'Enrolled'
            ELSE 'Pending'
          END as status
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN student_pii pii ON s.student_id = pii.student_id
        LEFT JOIN student_education edu ON s.student_id = edu.student_id
        LEFT JOIN curricula c ON edu.curriculum_id = c.curriculum_id
        LEFT JOIN programs p ON c.program_id = p.program_id
        LEFT JOIN section_assignments sa ON edu.assignment_id = sa.assignment_id
        LEFT JOIN sections sec ON sa.section_id = sec.section_id
        WHERE s.account_status = true 
        ORDER BY pii.last_name ASC
      `);
      return result.rows;
  },

  updatePassword: async (userId, hashedNewPassword) => {
    return await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           changed_pass = true, 
           updated_at = now() 
       WHERE user_id = $2`,
      [hashedNewPassword, userId]
    );
  },

  logAction: async (userId, actionType, details) => {
  // Get user's role
  const roleResult = await pool.query(
    `SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1 LIMIT 1`,
    [userId]
  );
  const userRole = roleResult.rows[0]?.role_name || 'Admin';
  
  return await pool.query(
    `INSERT INTO history_logs 
    (user_id, table_name, record_id, action, new_values) 
    VALUES ($1, $2, $3, $4, $5)`,
    [
      userId, 
      'users',     
      userId,     
      actionType,  
      JSON.stringify({ details, user_role: userRole })
    ]
  );
},

  acceptStudentsBulk: async (ids) => {
    return await pool.query(
      `UPDATE students 
      SET account_status = true
      WHERE user_id IN (
        SELECT user_id FROM users WHERE username = ANY($1)
      )`,
      [ids]
    );
  },

  rejectStudentsBulk: async (ids) => {
    return await pool.query(
      `DELETE FROM students 
      WHERE user_id IN (
        SELECT user_id FROM users WHERE username = ANY($1)
      )`,
      [ids]
    );
  },
  
  getStudentFullDetails: async (studentId) => {
    const result = await pool.query(`
      SELECT 
        -- Personal Info
        pii.first_name as firstname,
        pii.last_name as lastname,
        pii.middle_name as middlename,
        pii.suffix,
        pii.sex,
        pii.birth_place,
        pii.personal_email as email,
        pii.mobile_no,
        pii.landline as landline_no,
        pii.religion,
        pii.nationality,
        pii.civil_status,
        pii.height,
        pii.weight,
        pii.language_dialects,
        pii.visual_problems,
        
        -- Student
        s.birth_date,
        
        -- Present Address
        pa.house_no as present_houseno,
        pa.street as present_street,
        pa.barangay as present_sbdvsn_brgy,
        pa.city_municipality as present_city_mncplty,
        
        -- Provincial Address
        pra.house_no as provincial_houseno,
        pra.street as provincial_street,
        pra.barangay as provincial_sbdvsn_brgy,
        pra.city_municipality as provincial_city_mncplty,
        
        -- Education
        edu.year_level,
        edu.classification,
        p.program_abbr as program,
        sec.section_name as section,
        
        -- Highschool
        hs.highschool_graduated,
        hs.pubpriv_hs,
        hs.highschool_address,
        hs.hs_final_gwa,
        
        -- Father
        father.first_name as father_firstname,
        father.middle_name as father_middlename,
        father.last_name as father_lastname,
        father.suffix as father_suffix,
        father.occupation as father_occupation,
        father.contact_no as father_contact_no,
        CASE WHEN father.is_alive THEN 'LIVING' ELSE 'DECEASED' END as father_alive,
        
        -- Mother
        mother.first_name as mother_firstname,
        mother.middle_name as mother_middlename,
        mother.last_name as mother_lastname,
        mother.suffix as mother_suffix,
        mother.occupation as mother_occupation,
        mother.contact_no as mother_contact_no,
        CASE WHEN mother.is_alive THEN 'LIVING' ELSE 'DECEASED' END as mother_alive,
        
        -- Guardian
        guardian.first_name as guardian_firstname,
        guardian.middle_name as guardian_middlename,
        guardian.last_name as guardian_lastname,
        guardian.suffix as guardian_suffix,
        guardian.occupation as guardian_relation,
        guardian.contact_no as guardian_contact_no,
        
        -- Family
        fam.support,
        fam.parents_income,
        fam.living_in,
        fam.daily_transpo_expense,
        fam.no_siblings,
        fam.ordinal_position,
        
        -- Achievements
        ach.awards_honors,
        ach.hobbies_interests,
        ach.future_career,
        ach.acad_extracurr as acad_clubs_extracurr
        
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN student_pii pii ON s.student_id = pii.student_id
      LEFT JOIN student_addresses pa ON s.student_id = pa.student_id AND pa.address_type = 'Present'
      LEFT JOIN student_addresses pra ON s.student_id = pra.student_id AND pra.address_type = 'Provincial'
      LEFT JOIN student_education edu ON s.student_id = edu.student_id
      LEFT JOIN curricula c ON edu.curriculum_id = c.curriculum_id
      LEFT JOIN programs p ON c.program_id = p.program_id
      LEFT JOIN section_assignments sa ON edu.assignment_id = sa.assignment_id
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN student_highschool hs ON s.student_id = hs.student_id
      LEFT JOIN student_family_members father ON s.student_id = father.student_id AND father.relation_type = 'Father'
      LEFT JOIN student_family_members mother ON s.student_id = mother.student_id AND mother.relation_type = 'Mother'
      LEFT JOIN student_family_members guardian ON s.student_id = guardian.student_id AND guardian.relation_type = 'Guardian'
      LEFT JOIN student_family fam ON s.student_id = fam.student_id
      LEFT JOIN student_achievements ach ON s.student_id = ach.student_id
      WHERE u.username = $1
    `, [studentId]);

    return result.rows[0] || null;
  },
  //programs
  createProgram: async (data) => {
    const result = await pool.query(
      `INSERT INTO programs (program_name, program_abbr, total_year, program_description, program_status) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [data.name, data.abbreviation, data.total_years, data.description, data.status]
    );
    return result.rows[0];
  },
  
  getPrograms: async () => {
    const result = await pool.query(
      'SELECT * FROM programs ORDER BY created_at DESC'
    );
    return result.rows;
  },

  createSection: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the section
    const sectionResult = await client.query(
      `INSERT INTO sections (section_name, program_id)
       VALUES ($1, $2)
       RETURNING *`,
      [data.section_name, data.program_id]
    );
    const section = sectionResult.rows[0];

    // 2. Create section assignment (links to year, semester, year level)
    const assignResult = await client.query(
      `INSERT INTO section_assignments (section_id, year_id, semester_id, year_level, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [section.section_id, data.year_id, data.semester_id, data.year_level]
    );

    await client.query('COMMIT');
    return { ...section, ...assignResult.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  },

  getSections: async () => {
  const result = await pool.query(`
    SELECT 
      sa.assignment_id as id,
      s.section_name as name,
      p.program_abbr as program_name,
      sa.year_level,
      sem.semester_label as semester,
      ay.year_label as academic_year,
      (SELECT COUNT(*) FROM student_education se WHERE se.assignment_id = sa.assignment_id) as student_count
    FROM section_assignments sa
    JOIN sections s ON sa.section_id = s.section_id
    JOIN programs p ON s.program_id = p.program_id
    JOIN semester sem ON sa.semester_id = sem.semester_id
    JOIN academic_year ay ON sa.year_id = ay.year_id
    WHERE sa.is_active = true
    ORDER BY ay.year_label DESC, sem.semester_label, sa.year_level, s.section_name
  `);
  return result.rows;
},  

  // COURSES
createCourse: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const courseResult = await client.query(
      `INSERT INTO courses (course_code, course_name, lec_units, lab_units, course_desc, prerequisites)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.course_code, data.course_name, data.lec_units, data.lab_units, 
       data.course_desc, data.prerequisites || null]
    );
    const course = courseResult.rows[0];

    if (data.assignments && data.assignments.length > 0) {
      for (const assignment of data.assignments) {
        // Find or create curriculum for this program
        let currResult = await client.query(
          `SELECT curriculum_id FROM curricula 
           WHERE program_id = $1 AND is_active = true
           LIMIT 1`,
          [assignment.program_id]
        );

        let curriculumId;
        if (currResult.rows.length > 0) {
          curriculumId = currResult.rows[0].curriculum_id;
        } else {
          // Auto-create curriculum if doesn't exist
          const newCurr = await client.query(
            `INSERT INTO curricula (program_id, curriculum_year, version_name, is_active)
             VALUES ($1, '2025-2026', 'Default', true)
             RETURNING curriculum_id`,
            [assignment.program_id]
          );
          curriculumId = newCurr.rows[0].curriculum_id;
        }

        // Insert into curriculum_courses
        await client.query(
          `INSERT INTO curriculum_courses (curriculum_id, course_id, year_level, semester_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (curriculum_id, course_id) DO NOTHING`,
          [curriculumId, course.course_id, assignment.year_level, assignment.semester_id]
        );
      }
    }

    await client.query('COMMIT');
    return course;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
},

 getCourses: async () => {
  const result = await pool.query(`
    SELECT 
      c.course_id as id,
      c.course_code as code,
      c.course_name as name,
      c.lec_units,
      c.lab_units,
      (c.lec_units + c.lab_units) as units,
      c.prerequisites as prereq,
      c.is_active,
      STRING_AGG(DISTINCT p.program_abbr, ', ') as programs,
      STRING_AGG(DISTINCT 
        CASE cc.year_level
          WHEN 1 THEN '1st Year'
          WHEN 2 THEN '2nd Year'
          WHEN 3 THEN '3rd Year'
          WHEN 4 THEN '4th Year'
          WHEN 5 THEN '5th Year'
        END || ' - ' || sem.semester_label, ', '
      ) as year_sem
    FROM courses c
    LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
    LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
    LEFT JOIN programs p ON cur.program_id = p.program_id
    LEFT JOIN semester sem ON cc.semester_id = sem.semester_id
    GROUP BY c.course_id
    ORDER BY c.course_code
  `);
  return result.rows;
},


  createAcademicYear: async (data) => {
    if (data.is_active) {
      await pool.query('UPDATE academic_year SET is_active = false');
    }
    
    const result = await pool.query(
      `INSERT INTO academic_year (year_label, is_active) 
      VALUES ($1, $2) 
      RETURNING *`,
      [data.year_label, data.is_active]
    );
    return result.rows[0];
  },


  // CURRICULA
 createCurriculum: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate others if active
    if (data.is_active) {
      await client.query(
        'UPDATE curricula SET is_active = false WHERE program_id = $1',
        [data.program_id]
      );
    }

    // Insert curriculum
    const currResult = await client.query(
      `INSERT INTO curricula (program_id, curriculum_year, version_name, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.program_id, data.curriculum_year, data.version_name || 'Default', data.is_active]
    );
    const curriculum = currResult.rows[0];

    // Insert courses
    if (data.courses && data.courses.length > 0) {
      for (const course of data.courses) {
        await client.query(
          `INSERT INTO curriculum_courses (curriculum_id, course_id, year_level, semester_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (curriculum_id, course_id) DO NOTHING`,
          [curriculum.curriculum_id, course.course_id, course.year_level, course.semester_id]
        );
      }
    }

    await client.query('COMMIT');
    return curriculum;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
},

  getCurricula: async () => {
    const result = await pool.query(`
      SELECT 
        c.curriculum_id as id,
        p.program_abbr as program,
        p.program_name as program_name,
        c.curriculum_year,
        c.version_name,
        c.is_active,
        c.created_at,
        (SELECT COUNT(*) FROM curriculum_courses cc WHERE cc.curriculum_id = c.curriculum_id) as course_count
      FROM curricula c
      JOIN programs p ON c.program_id = p.program_id
      ORDER BY p.program_abbr, c.curriculum_year DESC
    `);
    return result.rows;
  },

  deleteCurriculum: async (id) => {
    await pool.query('DELETE FROM curricula WHERE curriculum_id = $1', [id]);
  },

  getAcademicYears: async () => {
    const result = await pool.query(
      'SELECT * FROM academic_year ORDER BY year_label DESC' 
    );
    return result.rows;
  },

  
  getStudentCourses: async (username, yearLevel, semesterId) => {
    const result = await pool.query(`
      SELECT DISTINCT ON (c.course_id)
        c.course_id,
        c.course_code,
        c.course_name,
        c.lec_units,
        c.lab_units,
        c.total_units,
        cc.year_level,
        cc.semester_id,
        g.grade_id,
        g.final_grade,
        g.remarks,
        (SELECT ROUND(AVG(gc.score), 2) FROM grade_components gc 
        WHERE gc.grade_id = g.grade_id AND gc.term = 'Prelim') as prelim_score,
        (SELECT ROUND(AVG(gc.score), 2) FROM grade_components gc 
        WHERE gc.grade_id = g.grade_id AND gc.term = 'Midterm') as midterm_score,
        (SELECT ROUND(AVG(gc.score), 2) FROM grade_components gc 
        WHERE gc.grade_id = g.grade_id AND gc.term = 'Final') as finals_score
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN student_education se ON s.student_id = se.student_id
      JOIN curriculum_courses cc ON se.curriculum_id = cc.curriculum_id 
        AND cc.year_level = $2 AND cc.semester_id = $3
      JOIN courses c ON cc.course_id = c.course_id
      LEFT JOIN grades g ON s.student_id = g.student_id 
        AND c.course_id = g.course_id 
        AND g.semester_id = $3
      WHERE u.username = $1
      ORDER BY c.course_id, g.grade_id DESC
    `, [username, yearLevel, semesterId]);
    return result.rows;
  },
// Save student grades
saveGrades: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [courseId, gradeData] of Object.entries(data.grades)) {
      const { prelim, midterm, finals, remarks } = gradeData;
      
      if (!prelim && !midterm && !finals && !remarks) continue;

      // Calculate final grade
      const scores = [parseFloat(prelim), parseFloat(midterm), parseFloat(finals)].filter(s => !isNaN(s));
      const finalGrade = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;

      // Get student's internal ID
      const studentRes = await client.query(
        `SELECT s.student_id FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.username = $1`,
        [data.student_id]
      );
      if (studentRes.rows.length === 0) continue;
      const studentId = studentRes.rows[0].student_id;

      // Check if grade exists
      const existingGrade = await client.query(
        `SELECT grade_id FROM grades WHERE student_id = $1 AND course_id = $2 AND semester_id = $3`,
        [studentId, courseId, data.semester_id]
      );

      let gradeId;
      if (existingGrade.rows.length > 0) {
        gradeId = existingGrade.rows[0].grade_id;
        await client.query(
          `UPDATE grades SET final_grade = $1, remarks = $2, updated_at = NOW() WHERE grade_id = $3`,
          [finalGrade, remarks || null, gradeId]
        );
      } else {
        const newGrade = await client.query(
          `INSERT INTO grades (student_id, course_id, year_id, semester_id, final_grade, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING grade_id`,
          [studentId, courseId, data.year_id, data.semester_id, finalGrade, remarks || null]
        );
        gradeId = newGrade.rows[0].grade_id;
      }

      // Save grade components
      const terms = [
        { name: 'Prelim', score: prelim },
        { name: 'Midterm', score: midterm },
        { name: 'Final', score: finals }
      ];

      for (const term of terms) {
        if (term.score && !isNaN(parseFloat(term.score))) {
          const existingComp = await client.query(
            `SELECT component_id FROM grade_components WHERE grade_id = $1 AND term = $2`,
            [gradeId, term.name]
          );
          if (existingComp.rows.length > 0) {
            await client.query(
              `UPDATE grade_components SET score = $1, updated_at = NOW() WHERE component_id = $2`,
              [parseFloat(term.score), existingComp.rows[0].component_id]
            );
          } else {
            await client.query(
              `INSERT INTO grade_components (grade_id, term, component_name, score, percentage)
               VALUES ($1, $2, $3, $4, 33.33)`,
              [gradeId, term.name, term.name + ' Grade', parseFloat(term.score)]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
},
saveGradeDetails: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentRes = await client.query(
      `SELECT s.student_id FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.username = $1`,
      [data.student_id]
    );
    if (studentRes.rows.length === 0) throw new Error('Student not found');
    const studentId = studentRes.rows[0].student_id;

    const yearRes = await client.query(`SELECT year_id FROM academic_year WHERE is_active = true LIMIT 1`);
    const yearId = yearRes.rows[0]?.year_id;

    // Fix remarks - empty string = null
    const remarksValue = data.remarks && data.remarks.trim() !== '' ? data.remarks : null;

    const existing = await client.query(
      `SELECT grade_id FROM grades WHERE student_id = $1 AND course_id = $2`,
      [studentId, data.course_id]
    );

    let gradeId;
    if (existing.rows.length > 0) {
      gradeId = existing.rows[0].grade_id;
      await client.query(
        `UPDATE grades SET final_grade = $1, remarks = $2, updated_at = NOW() WHERE grade_id = $3`,
        [data.final_grade, remarksValue, gradeId]
      );
    } else {
      const newGrade = await client.query(
        `INSERT INTO grades (student_id, course_id, year_id, semester_id, final_grade, remarks)
         VALUES ($1, $2, $3, 1, $4, $5)
         RETURNING grade_id`,
        [studentId, data.course_id, yearId, data.final_grade, remarksValue]
      );
      gradeId = newGrade.rows[0].grade_id;
    }

    // Delete only the components for terms that have incoming data,
    // preserving all other terms untouched.
    if (data.scores) {
      for (const [term, components] of Object.entries(data.scores)) {
        if (components && typeof components === 'object') {
          // Wipe old rows for this specific term only
          await client.query(
            `DELETE FROM grade_components WHERE grade_id = $1 AND term = $2`,
            [gradeId, term]
          );

          // Insert fresh rows for this term
          for (const [key, value] of Object.entries(components)) {
            if (value && value.score !== '' && value.total !== '') {
              await client.query(
                `INSERT INTO grade_components
                   (grade_id, term, component_name, score, total, percentage)
                 VALUES ($1, $2, $3, $4, $5, 0)`,
                [gradeId, term, key, parseFloat(value.score), parseFloat(value.total)]
              );
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
},


getGradeDetails: async (username, courseId) => {
  const result = await pool.query(`
    SELECT 
      gc.component_id,
      gc.grade_id,
      gc.term,
      gc.component_name,
      gc.score,
      gc.total,
      gc.percentage,
      g.remarks
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN grades g ON s.student_id = g.student_id AND g.course_id = $2
    JOIN grade_components gc ON g.grade_id = gc.grade_id
    WHERE u.username = $1
    ORDER BY gc.term, gc.component_name
  `, [username, courseId]);
  
  return {
    components: result.rows,
    remarks: result.rows[0]?.remarks || ''
  };
},

getAnalytics: async () => {
  const result = await pool.query(`
    WITH 
    program_stats AS (
      SELECT p.program_abbr, COUNT(*) as count
      FROM student_education se
      JOIN curricula c ON se.curriculum_id = c.curriculum_id
      JOIN programs p ON c.program_id = p.program_id
      WHERE se.enrollment_status = 'Enrolled'
      GROUP BY p.program_abbr
    ),
    year_stats AS (
      SELECT se.year_level::text, COUNT(*) as count
      FROM student_education se
      WHERE se.enrollment_status = 'Enrolled'
      GROUP BY se.year_level
      ORDER BY se.year_level
    ),
    grade_stats AS (
      SELECT g.final_grade::text, COUNT(*) as count
      FROM grades g
      WHERE g.final_grade IS NOT NULL
      GROUP BY g.final_grade
      ORDER BY g.final_grade
    ),
    pass_fail AS (
      SELECT 
        CASE WHEN g.remarks = 'P' THEN 'Passed' ELSE 'Failed' END as status,
        COUNT(*) as count
      FROM grades g
      WHERE g.remarks IS NOT NULL
      GROUP BY g.remarks
    )
    SELECT 
      (SELECT json_agg(row_to_json(program_stats)) FROM program_stats) as programs,
      (SELECT json_agg(row_to_json(year_stats)) FROM year_stats) as year_levels,
      (SELECT json_agg(row_to_json(grade_stats)) FROM grade_stats) as grades,
      (SELECT json_agg(row_to_json(pass_fail)) FROM pass_fail) as pass_fail,
      (SELECT year_label FROM academic_year WHERE is_active = true LIMIT 1) as active_year
  `);
  
  const data = result.rows[0];
  return {
    programs: data.programs || [],
    yearLevels: data.year_levels || [],
    grades: data.grades || [],
    passFail: data.pass_fail || [],
    activeYear: data.active_year || '2025-2026'
  };
},

getDashboardStats: async () => {
  const result = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM students WHERE account_status = true) as total_students,
      (SELECT COUNT(*) FROM programs WHERE program_status = true) as active_programs,
      (SELECT COUNT(*) FROM courses) as total_courses,
      (SELECT COUNT(*) FROM sections) as total_sections,
      (SELECT ROUND(AVG(final_grade::numeric), 2) FROM grades WHERE final_grade IS NOT NULL) as avg_grade,
      (SELECT COUNT(*) FILTER (WHERE remarks = 'P') FROM grades) as passed,
      (SELECT COUNT(*) FILTER (WHERE remarks = 'F') FROM grades) as failed,
      (SELECT year_label FROM academic_year WHERE is_active = true LIMIT 1) as active_year
  `);
  return result.rows[0];
},


getAllUsers: async () => {
  const result = await pool.query(`
    SELECT 
      u.user_id,
      u.username,
      u.is_active,
      u.created_at,
      STRING_AGG(r.role_name, ', ') as roles,
      f.first_name,
      f.last_name,
      d.designation_name
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    LEFT JOIN faculties f ON u.user_id = f.user_id
    LEFT JOIN designations d ON f.designation = d.designation_id
    WHERE r.role_name IN ('Admin', 'Faculty', 'Developer')
       OR r.role_name IS NULL
    GROUP BY u.user_id, f.faculty_id, d.designation_name
    ORDER BY u.created_at DESC
  `);
  return result.rows;
},

createUser: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash(data.password || 'faculty123', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id`,
      [data.username, hash]
    );
    const userId = userResult.rows[0].user_id;
    
    if (data.role) {
      const roleResult = await client.query(
        `SELECT role_id FROM roles WHERE role_name = $1`, [data.role]
      );
      if (roleResult.rows.length > 0) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
          [userId, roleResult.rows[0].role_id]
        );
      }
    }
    
    await client.query('COMMIT');
    return { userId };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
},

toggleUserStatus: async (userId, isActive) => {
  await pool.query(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE user_id = $2`,
    [isActive, userId]
  );
},

};


module.exports = Admin;