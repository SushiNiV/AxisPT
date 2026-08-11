const db = require('../config/db');

class StudentManageModel {

  /**
   * Helper: Get active academic year and active semester
   */
  static async getActiveAcademicTerm(client) {
    const res = await client.query(`
      SELECT ay.year_id, ay.current_sem 
      FROM academic_year ay 
      WHERE ay.is_active = true 
      LIMIT 1
    `);
    return res.rows[0] || { year_id: null, current_sem: null };
  }

  /**
   * READ: Fetch filtered/paginated summary list for tables
   */
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
        CONCAT_WS(' ', 
          p.first_name, 
          NULLIF(p.middle_name, ''), 
          p.last_name, 
          NULLIF(p.suffix, '')
        ) AS full_name,
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

  /**
   * READ: Fetch complete, aggregated detailed record for single student (Edit / View overlay)
   */
  static async getById(studentId) {
    const mainQuery = `
      SELECT 
        s.student_id,
        s.birth_date,
        s.account_status,
        u.user_id,
        u.username AS student_number,
        u.is_active AS user_active,
        
        -- PII Details
        pii.first_name, pii.middle_name, pii.last_name, pii.suffix, pii.sex,
        pii.birth_place, pii.personal_email, pii.mobile_no, pii.landline,
        pii.religion, pii.nationality, pii.civil_status, pii.height, pii.weight,
        pii.language_dialects, pii.visual_problems,

        -- High School Details
        hs.highschool_graduated, hs.pubpriv_hs, hs.highschool_address, hs.hs_final_gwa,

        -- Family Info Summary
        fam.support, fam.parents_income, fam.living_in, fam.daily_transpo_expense,
        fam.no_siblings, fam.ordinal_position,

        -- Achievements
        ach.awards_honors, ach.hobbies_interests, ach.future_career, ach.acad_extracurr,

        -- Education (Current State)
        edu.education_id, edu.curriculum_id, edu.assignment_id, edu.year_id,
        edu.semester_id, edu.year_level, edu.classification, edu.enrollment_status,
        p.program_id, p.program_name, p.program_abbr, p.program_code

      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN student_pii pii ON pii.student_id = s.student_id
      LEFT JOIN student_highschool hs ON hs.student_id = s.student_id
      LEFT JOIN student_family fam ON fam.student_id = s.student_id
      LEFT JOIN student_achievements ach ON ach.student_id = s.student_id
      LEFT JOIN student_education edu ON edu.student_id = s.student_id AND edu.is_current = true
      LEFT JOIN curricula c ON c.curriculum_id = edu.curriculum_id
      LEFT JOIN programs p ON p.program_id = c.program_id
      WHERE s.student_id = $1
    `;

    const res = await db.query(mainQuery, [studentId]);
    if (res.rows.length === 0) return null;

    const studentData = res.rows[0];

    // Fetch related address rows (Present & Provincial)
    const addrRes = await db.query(
      `SELECT * FROM student_addresses WHERE student_id = $1`,
      [studentId]
    );

    // Fetch related family members
    const membersRes = await db.query(
      `SELECT * FROM student_family_members WHERE student_id = $1`,
      [studentId]
    );

    studentData.addresses = addrRes.rows;
    studentData.family_members = membersRes.rows;

    return studentData;
  }

  /**
   * CREATE: Insert new student into relational tables within a transaction
   */
  static async create(data) {
    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      // 1. Insert into users
      const userRes = await client.query(`
        INSERT INTO users (username, password_hash, recovery_email, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      `, [
        data.student_number || data.studentNumber,
        data.password_hash || null,
        data.personal_email || data.email || null,
        data.account_status !== undefined ? Boolean(data.account_status) : true
      ]);
      const userId = userRes.rows[0].user_id;

      // 2. Assign 'Student' role in user_roles
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, (SELECT role_id FROM roles WHERE role_name = 'Student' LIMIT 1))
        ON CONFLICT DO NOTHING
      `);

      // 3. Insert into students
      const studentRes = await client.query(`
        INSERT INTO students (user_id, birth_date, account_status)
        VALUES ($1, $2, $3)
        RETURNING student_id
      `, [
        userId,
        data.birth_date || data.birthDate || null,
        data.account_status !== undefined ? Boolean(data.account_status) : true
      ]);
      const studentId = studentRes.rows[0].student_id;

      // 4. Insert into student_pii
      await client.query(`
        INSERT INTO student_pii (
          student_id, last_name, first_name, middle_name, suffix, sex,
          birth_place, personal_email, mobile_no, landline, religion,
          nationality, civil_status, height, weight, language_dialects, visual_problems
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        studentId,
        data.last_name || data.lastName || null,
        data.first_name || data.firstName || null,
        data.middle_name || data.middleName || null,
        data.suffix || null,
        data.sex || null,
        data.birth_place || null,
        data.personal_email || data.email || null,
        data.mobile_no || data.mobileNo || null,
        data.landline || null,
        data.religion || null,
        data.nationality || null,
        data.civil_status || data.civilStatus || null,
        data.height ? parseFloat(data.height) : null,
        data.weight ? parseFloat(data.weight) : null,
        data.language_dialects || null,
        data.visual_problems || null
      ]);

      // 5. Insert addresses (Supports single flat address or nested objects)
      const street = data.street || (data.present_address && data.present_address.street);
      const barangay = data.barangay || (data.present_address && data.present_address.barangay);
      const city = data.city_municipality || data.city || (data.present_address && data.present_address.city_municipality);
      const province = data.province || (data.present_address && data.present_address.province);

      if (street || barangay || city || province) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province)
          VALUES ($1, 'Present', $2, $3, $4, $5, $6)
        `, [
          studentId,
          data.house_no || null,
          street || null,
          barangay || null,
          city || null,
          province || null
        ]);
      }

      if (data.provincial_address) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province)
          VALUES ($1, 'Provincial', $2, $3, $4, $5, $6)
        `, [
          studentId,
          data.provincial_address.house_no || null,
          data.provincial_address.street || null,
          data.provincial_address.barangay || null,
          data.provincial_address.city_municipality || null,
          data.provincial_address.province || null
        ]);
      }

      // 6. Insert student_highschool
      const hsGrad = data.highschool_graduated || data.highschoolName;
      const hsGwa = data.hs_final_gwa || data.hsGwa;
      if (hsGrad || hsGwa || data.highschool_address) {
        await client.query(`
          INSERT INTO student_highschool (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          studentId,
          hsGrad || null,
          data.pubpriv_hs || null,
          data.highschool_address || null,
          hsGwa ? parseFloat(hsGwa) : null
        ]);
      }

      // 7. Insert student_family
      if (data.family_info) {
        await client.query(`
          INSERT INTO student_family (student_id, support, parents_income, living_in, daily_transpo_expense, no_siblings, ordinal_position)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          studentId,
          data.family_info.support || null,
          data.family_info.parents_income || null,
          data.family_info.living_in || null,
          data.family_info.daily_transpo_expense || null,
          data.family_info.no_siblings ? parseInt(data.family_info.no_siblings) : null,
          data.family_info.ordinal_position ? parseInt(data.family_info.ordinal_position) : null
        ]);
      }

      // 8. Insert student_family_members
      if (Array.isArray(data.family_members) && data.family_members.length > 0) {
        for (const member of data.family_members) {
          await client.query(`
            INSERT INTO student_family_members (
              student_id, relation_type, first_name, middle_name, last_name, suffix, occupation, contact_no, is_alive, is_guardian
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            studentId,
            member.relation_type,
            member.first_name || null,
            member.middle_name || null,
            member.last_name || null,
            member.suffix || null,
            member.occupation || null,
            member.contact_no || null,
            member.is_alive !== undefined ? Boolean(member.is_alive) : true,
            member.is_guardian !== undefined ? Boolean(member.is_guardian) : false
          ]);
        }
      }

      // 9. Insert student_achievements
      if (data.achievements) {
        await client.query(`
          INSERT INTO student_achievements (student_id, awards_honors, hobbies_interests, future_career, acad_extracurr)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          studentId,
          data.achievements.awards_honors || null,
          data.achievements.hobbies_interests || null,
          data.achievements.future_career || null,
          data.achievements.acad_extracurr || null
        ]);
      }

      // 10. Insert student_education
      const termInfo = await this.getActiveAcademicTerm(client);
      const curriculumId = data.curriculum_id || data.curriculumId;
      const yearLevel = data.year_level || data.yearLevel;

      await client.query(`
        INSERT INTO student_education (
          student_id, curriculum_id, assignment_id, year_id, semester_id, year_level, classification, enrollment_status, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      `, [
        studentId,
        curriculumId || null,
        data.assignment_id || null,
        data.year_id || termInfo.year_id,
        data.semester_id || termInfo.current_sem,
        yearLevel ? String(yearLevel) : '1',
        data.classification || 'New',
        data.enrollment_status || 'Enrolled'
      ]);

      if (isDedicatedClient) await client.query('COMMIT');
      return { student_id: studentId, user_id: userId };
    } catch (error) {
      if (isDedicatedClient) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (isDedicatedClient && client.release) client.release();
    }
  }

  /**
   * UPDATE: Modify an existing student record across all normalized tables
   */
  static async update(studentId, data) {
    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      const studentNumber = data.student_number || data.studentNumber;
      const accountStatus = data.account_status !== undefined ? data.account_status : data.accountStatus;

      // 1. Update users
      if (studentNumber || accountStatus !== undefined) {
        await client.query(`
          UPDATE users 
          SET 
            username = COALESCE($1, username),
            is_active = COALESCE($2, is_active),
            updated_at = NOW()
          WHERE user_id = (SELECT user_id FROM students WHERE student_id = $3)
        `, [
          studentNumber || null,
          accountStatus !== undefined ? Boolean(accountStatus) : null,
          studentId
        ]);
      }

      // 2. Update students
      const birthDate = data.birth_date || data.birthDate;
      await client.query(`
        UPDATE students 
        SET 
          birth_date = COALESCE($1, birth_date),
          account_status = COALESCE($2, account_status),
          updated_at = NOW()
        WHERE student_id = $3
      `, [
        birthDate || null,
        accountStatus !== undefined ? Boolean(accountStatus) : null,
        studentId
      ]);

      // 3. Upsert student_pii
      await client.query(`
        INSERT INTO student_pii (
          student_id, last_name, first_name, middle_name, suffix, sex,
          birth_place, personal_email, mobile_no, landline, religion,
          nationality, civil_status, height, weight, language_dialects, visual_problems, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          last_name = COALESCE(EXCLUDED.last_name, student_pii.last_name),
          first_name = COALESCE(EXCLUDED.first_name, student_pii.first_name),
          middle_name = EXCLUDED.middle_name,
          suffix = EXCLUDED.suffix,
          sex = EXCLUDED.sex,
          birth_place = EXCLUDED.birth_place,
          personal_email = EXCLUDED.personal_email,
          mobile_no = EXCLUDED.mobile_no,
          landline = EXCLUDED.landline,
          religion = EXCLUDED.religion,
          nationality = EXCLUDED.nationality,
          civil_status = EXCLUDED.civil_status,
          height = EXCLUDED.height,
          weight = EXCLUDED.weight,
          language_dialects = EXCLUDED.language_dialects,
          visual_problems = EXCLUDED.visual_problems,
          updated_at = NOW()
      `, [
        studentId,
        data.last_name || data.firstName || null,
        data.first_name || data.lastName || null,
        data.middle_name || data.middleName || null,
        data.suffix || null,
        data.sex || null,
        data.birth_place || null,
        data.personal_email || data.email || null,
        data.mobile_no || data.mobileNo || null,
        data.landline || null,
        data.religion || null,
        data.nationality || null,
        data.civil_status || data.civilStatus || null,
        data.height ? parseFloat(data.height) : null,
        data.weight ? parseFloat(data.weight) : null,
        data.language_dialects || null,
        data.visual_problems || null
      ]);

      // 4. Upsert Present Address
      const street = data.street || (data.present_address && data.present_address.street);
      const barangay = data.barangay || (data.present_address && data.present_address.barangay);
      const city = data.city_municipality || data.city || (data.present_address && data.present_address.city_municipality);
      const province = data.province || (data.present_address && data.present_address.province);

      if (street || barangay || city || province) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province, updated_at)
          VALUES ($1, 'Present', $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (student_id, address_type) DO UPDATE SET
            house_no = EXCLUDED.house_no,
            street = EXCLUDED.street,
            barangay = EXCLUDED.barangay,
            city_municipality = EXCLUDED.city_municipality,
            province = EXCLUDED.province,
            updated_at = NOW()
        `, [
          studentId,
          data.house_no || null,
          street || null,
          barangay || null,
          city || null,
          province || null
        ]);
      }

      // 5. Upsert High School
      const hsGrad = data.highschool_graduated || data.highschoolName;
      const hsGwa = data.hs_final_gwa || data.hsGwa;
      if (hsGrad || hsGwa || data.highschool_address) {
        await client.query(`
          INSERT INTO student_highschool (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (student_id) DO UPDATE SET
            highschool_graduated = EXCLUDED.highschool_graduated,
            pubpriv_hs = EXCLUDED.pubpriv_hs,
            highschool_address = EXCLUDED.highschool_address,
            hs_final_gwa = EXCLUDED.hs_final_gwa,
            updated_at = NOW()
        `, [
          studentId,
          hsGrad || null,
          data.pubpriv_hs || null,
          data.highschool_address || null,
          hsGwa ? parseFloat(hsGwa) : null
        ]);
      }

      // 6. Upsert Family Summary
      if (data.family_info) {
        await client.query(`
          INSERT INTO student_family (student_id, support, parents_income, living_in, daily_transpo_expense, no_siblings, ordinal_position, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (student_id) DO UPDATE SET
            support = EXCLUDED.support,
            parents_income = EXCLUDED.parents_income,
            living_in = EXCLUDED.living_in,
            daily_transpo_expense = EXCLUDED.daily_transpo_expense,
            no_siblings = EXCLUDED.no_siblings,
            ordinal_position = EXCLUDED.ordinal_position,
            updated_at = NOW()
        `, [
          studentId,
          data.family_info.support || null,
          data.family_info.parents_income || null,
          data.family_info.living_in || null,
          data.family_info.daily_transpo_expense || null,
          data.family_info.no_siblings ? parseInt(data.family_info.no_siblings) : null,
          data.family_info.ordinal_position ? parseInt(data.family_info.ordinal_position) : null
        ]);
      }

      // 7. Upsert Achievements
      if (data.achievements) {
        await client.query(`
          INSERT INTO student_achievements (student_id, awards_honors, hobbies_interests, future_career, acad_extracurr, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (student_id) DO UPDATE SET
            awards_honors = EXCLUDED.awards_honors,
            hobbies_interests = EXCLUDED.hobbies_interests,
            future_career = EXCLUDED.future_career,
            acad_extracurr = EXCLUDED.acad_extracurr,
            updated_at = NOW()
        `, [
          studentId,
          data.achievements.awards_honors || null,
          data.achievements.hobbies_interests || null,
          data.achievements.future_career || null,
          data.achievements.acad_extracurr || null
        ]);
      }

      // 8. Update active education status
      const curriculumId = data.curriculum_id || data.curriculumId;
      const yearLevel = data.year_level || data.yearLevel;
      if (curriculumId || yearLevel || data.classification || data.enrollment_status) {
        await client.query(`
          UPDATE student_education SET
            curriculum_id = COALESCE($1, curriculum_id),
            assignment_id = COALESCE($2, assignment_id),
            year_level = COALESCE($3, year_level),
            classification = COALESCE($4, classification),
            enrollment_status = COALESCE($5, enrollment_status),
            updated_at = NOW()
          WHERE student_id = $6 AND is_current = true
        `, [
          curriculumId || null,
          data.assignment_id || null,
          yearLevel ? String(yearLevel) : null,
          data.classification || null,
          data.enrollment_status || null,
          studentId
        ]);
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
}

module.exports = StudentManageModel;