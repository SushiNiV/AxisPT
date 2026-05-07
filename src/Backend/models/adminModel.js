const pool = require('../config/db');

const Admin = {
  findById: async (employeeID) => {
    const result = await pool.query(
      'SELECT * FROM administrators WHERE employee_id = $1',
      [employeeID]
    );
    return result.rows[0];
  },

  logLoginAction: async (user, details) => {
    return await pool.query(
      'INSERT INTO history_transactions (user_id, user_role, user_designation, action, target_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.employee_id, user.role, user.designation, 'LOGIN', user.employee_id, details]
    );
  },

  getPending: async () => {
    const result = await pool.query(`
      SELECT 
        s.student_id,
        s.account_status,
        s.created_at,
        pii.firstname,
        pii.lastname,
        pii.middlename,
        pii.email,
        pii.mobile_no,
        edu.program,
        edu.year_level,
        edu.section,
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
      pii.firstname || ' ' || pii.lastname as name,
      edu.program,
      edu.year_level as year,
      edu.section as block,
      CASE 
        WHEN s.account_status = true THEN 'Enrolled'
        ELSE 'Pending'
      END as status
    FROM students s
    LEFT JOIN student_pii pii ON s.student_id = pii.student_id
    LEFT JOIN student_education edu ON s.student_id = edu.student_id
    WHERE s.account_status = true 
    ORDER BY pii.lastname ASC
  `);
  return result.rows;
},

  updatePassword: async (employeeID, hashedNewPassword) => {
    return await pool.query(
      'UPDATE administrators SET password_hash = $1, must_change_password = false WHERE employee_id = $2',
      [hashedNewPassword, employeeID]
    );
  },

  logAction: async (user, actionType, details) => {
    return await pool.query(
      'INSERT INTO history_transactions (user_id, user_role, user_designation, action, target_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.employee_id, user.role, user.designation, actionType, user.employee_id, details]
    );
  },

  acceptStudentsBulk: async (ids) => {
    return await pool.query(
      `UPDATE students 
       SET account_status = true, 
           must_change_password = true 
       WHERE student_id = ANY($1)`,
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
        fam.parents_income,
        pii.*, 
        edu.*, 
        fam.*, 
        ach.*
      FROM student_pii pii
      INNER JOIN students s ON pii.student_id = s.student_id
      LEFT JOIN student_education edu ON pii.student_id = edu.student_id
      LEFT JOIN student_family fam ON pii.student_id = fam.student_id
      LEFT JOIN student_achievements_interest ach ON pii.student_id = ach.student_id
      WHERE pii.student_id = $1
    `, [studentId]);

    return result.rows[0] || null;
  },

  //programs
  createProgram: async (data) => {
    const result = await pool.query(
      `INSERT INTO programs (name, abbreviation, total_years, description, status) 
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

};


module.exports = Admin;