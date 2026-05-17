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
        s.account_status,
        s.created_at,
        pii.first_name, -- Fix: Schema uses first_name
        pii.last_name,  -- Fix: Schema uses last_name
        pii.middle_name, -- Fix: Schema uses middle_name
        pii.personal_email as email, -- Fix: Schema uses personal_email
        pii.mobile_no,
        edu.year_level,
        edu.classification
      FROM students s
      LEFT JOIN student_pii pii ON s.student_id = pii.student_id
      LEFT JOIN student_education edu ON s.student_id = edu.student_id
      WHERE s.account_status = false 
      ORDER BY s.created_at DESC
    `);
    return result.rows;
  },

  getMasterlist: async () => {
    const result = await pool.query(`
      SELECT 
        s.student_id as id,
        s.account_status,
        pii.first_name || ' ' || pii.last_name as name, -- Fixed column names
        p.program_abbr as program, -- Joined programs table to get the name
        edu.year_level as year,
        CASE 
          WHEN s.account_status = true THEN 'Enrolled'
          ELSE 'Pending'
        END as status
      FROM students s
      LEFT JOIN student_pii pii ON s.student_id = pii.student_id
      LEFT JOIN student_education edu ON s.student_id = edu.student_id
      LEFT JOIN curricula c ON edu.curriculum_id = c.curriculum_id -- Needed for program name
      LEFT JOIN programs p ON c.program_id = p.program_id
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
    return await pool.query(
      `INSERT INTO history_logs 
      (user_id, table_name, record_id, action, new_values) 
      VALUES ($1, $2, $3, $4, $5)`,
      [
        userId, 
        'users',     
        userId,     
        actionType,  
        JSON.stringify({ details }) 
      ]
    );
  },

  acceptStudentsBulk: async (ids) => {
    return await pool.query(
      `UPDATE students 
       SET account_status = true
       WHERE student_id = ANY($1)`, // Fix: Removed non-existent must_change_password
      [ids]
    );
  },

  rejectStudentsBulk: async (ids) => {
    // If rejecting means deleting their record entirely:
    return await pool.query(
      'DELETE FROM students WHERE student_id = ANY($1)',
      [ids]
    );
  },
  
  getStudentFullDetails: async (studentId) => {
    const result = await pool.query(`
      SELECT 
        s.birth_date,
        pii.*, 
        edu.*, 
        fam.*, 
        ach.*
      FROM student_pii pii
      INNER JOIN students s ON pii.student_id = s.student_id
      LEFT JOIN student_education edu ON pii.student_id = edu.student_id
      LEFT JOIN student_family fam ON pii.student_id = fam.student_id
      LEFT JOIN student_achievements ach ON pii.student_id = ach.student_id -- Fixed table name
      WHERE pii.student_id = $1
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
        0 as student_count
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
        c.total_units as units,
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


};


module.exports = Admin;