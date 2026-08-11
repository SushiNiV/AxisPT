const db = require('../config/db');

class StudentManageModel {
  
  // Get all active / filtered students with complete basic info
  static async getMasterlist({ search = '', programId = null, limit = 100, offset = 0 }) {
    let query = `
      SELECT 
        s.student_id,
        u.user_id,
        u.username AS student_number,
        s.account_status,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.suffix,
        p.personal_email,
        se.year_level,
        se.classification,
        se.enrollment_status,
        sec.section_name,
        prog.program_id,
        prog.program_code,
        prog.program_abbr
      FROM students s
      LEFT JOIN users u ON s.user_id = u.user_id
      LEFT JOIN student_pii p ON s.student_id = p.student_id
      LEFT JOIN student_education se ON s.student_id = se.student_id AND se.is_current = true
      LEFT JOIN section_assignments sa ON se.assignment_id = sa.assignment_id
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN curricula c ON se.curriculum_id = c.curriculum_id
      LEFT JOIN programs prog ON c.program_id = prog.program_id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR 
        u.username ILIKE $${paramIndex}
      )`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (programId) {
      query += ` AND prog.program_id = $${paramIndex}`;
      values.push(programId);
      paramIndex++;
    }

    query += ` ORDER BY p.last_name ASC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  // Fetch full detailed record for single student (Edit Overlay)
  static async getById(studentId) {
    const query = `
      SELECT 
        s.student_id,
        u.user_id,
        u.username AS student_number,
        s.account_status,
        s.birth_date,
        p.last_name,
        p.first_name,
        p.middle_name,
        p.suffix,
        p.personal_email,
        p.mobile_no,
        p.sex,
        p.civil_status,
        p.street,
        p.barangay,
        p.city_municipality,
        p.province,
        p.highschool_graduated,
        p.hs_final_gwa,
        se.year_level,
        se.classification,
        se.enrollment_status,
        se.curriculum_id,
        c.program_id
      FROM students s
      LEFT JOIN users u ON s.user_id = u.user_id
      LEFT JOIN student_pii p ON s.student_id = p.student_id
      LEFT JOIN student_education se ON s.student_id = se.student_id AND se.is_current = true
      LEFT JOIN curricula c ON se.curriculum_id = c.curriculum_id
      WHERE s.student_id = $1
    `;
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  // Create new Student across users, students, student_pii, and student_education
  static async create(data) {
    const client = await db.getClient ? await db.getClient() : db; // transaction support
    try {
      if (client.query) await client.query('BEGIN');

      const {
        studentNumber, email, firstName, middleName, lastName, suffix,
        accountStatus, birthDate, sex, mobileNo, civilStatus, street,
        barangay, city, province, highschoolName, hsGwa, yearLevel, curriculumId
      } = data;

      // 1. Insert into users table
      const userRes = await client.query(`
        INSERT INTO users (username, role, is_active)
        VALUES ($1, 'student', $2)
        RETURNING user_id
      `, [studentNumber, accountStatus]);
      const userId = userRes.rows[0].user_id;

      // 2. Insert into students table
      const studentRes = await client.query(`
        INSERT INTO students (user_id, birth_date, account_status)
        VALUES ($1, $2, $3)
        RETURNING student_id
      `, [userId, birthDate || null, accountStatus ? 'Active' : 'Inactive']);
      const studentId = studentRes.rows[0].student_id;

      // 3. Insert into student_pii
      await client.query(`
        INSERT INTO student_pii (
          student_id, first_name, middle_name, last_name, suffix,
          personal_email, mobile_no, sex, civil_status, street,
          barangay, city_municipality, province, highschool_graduated, hs_final_gwa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        studentId, firstName, middleName || null, lastName, suffix || null,
        email, mobileNo || null, sex || null, civilStatus || null, street || null,
        barangay || null, city || null, province || null, highschoolName || null, hsGwa || null
      ]);

      // 4. Insert initial student_education record
      if (curriculumId) {
        await client.query(`
          INSERT INTO student_education (student_id, curriculum_id, year_level, is_current)
          VALUES ($1, $2, $3, true)
        `, [studentId, curriculumId, yearLevel || 1]);
      }

      if (client.query) await client.query('COMMIT');
      return { student_id: studentId, user_id: userId };
    } catch (error) {
      if (client.query) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (client.release) client.release();
    }
  }

  // Update existing student record
  static async update(studentId, data) {
    const client = await db.getClient ? await db.getClient() : db;
    try {
      if (client.query) await client.query('BEGIN');

      const {
        userId, studentNumber, email, firstName, middleName, lastName, suffix,
        accountStatus, birthDate, sex, mobileNo, civilStatus, street,
        barangay, city, province, highschoolName, hsGwa, yearLevel, curriculumId
      } = data;

      // 1. Update user
      if (userId) {
        await client.query(`
          UPDATE users SET username = $1, is_active = $2, updated_at = NOW()
          WHERE user_id = $3
        `, [studentNumber, accountStatus, userId]);
      }

      // 2. Update student status & birthdate
      await client.query(`
        UPDATE students SET birth_date = $1, account_status = $2
        WHERE student_id = $3
      `, [birthDate || null, accountStatus ? 'Active' : 'Inactive', studentId]);

      // 3. Update student_pii
      await client.query(`
        UPDATE student_pii SET
          first_name = $1, middle_name = $2, last_name = $3, suffix = $4,
          personal_email = $5, mobile_no = $6, sex = $7, civil_status = $8,
          street = $9, barangay = $10, city_municipality = $11, province = $12,
          highschool_graduated = $13, hs_final_gwa = $14
        WHERE student_id = $15
      `, [
        firstName, middleName || null, lastName, suffix || null,
        email, mobileNo || null, sex || null, civilStatus || null,
        street || null, barangay || null, city || null, province || null,
        highschoolName || null, hsGwa || null, studentId
      ]);

      // 4. Update student education level
      if (curriculumId) {
        await client.query(`
          UPDATE student_education 
          SET year_level = $1, curriculum_id = $2
          WHERE student_id = $3 AND is_current = true
        `, [yearLevel || 1, curriculumId, studentId]);
      }

      if (client.query) await client.query('COMMIT');
      return true;
    } catch (error) {
      if (client.query) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (client.release) client.release();
    }
  }

  // Delete student
  static async delete(studentId) {
    const result = await db.query(`DELETE FROM students WHERE student_id = $1`, [studentId]);
    return result.rowCount > 0;
  }
}

module.exports = StudentManageModel;