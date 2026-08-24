const db = require('../config/db');

class StudentManageModel {

  static async getActiveAcademicTerm(client) {
    const res = await client.query(`
      SELECT ay.year_id, ay.current_sem 
      FROM academic_year ay 
      WHERE ay.is_active = true 
      LIMIT 1
    `);
    return res.rows[0] || { year_id: null, current_sem: null };
  }

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

  static async getById(studentId) {
    const mainQuery = `
      SELECT 
        s.student_id,
        s.birth_date,
        s.account_status,
        u.user_id,
        u.username AS student_number,
        u.school_email,
        u.is_active AS user_active,
        
        pii.first_name AS firstname,
        pii.middle_name AS middlename,
        pii.last_name AS lastname,
        pii.suffix,
        pii.sex,
        pii.birth_place AS place_of_birth,
        pii.personal_email AS email,
        pii.mobile_no,
        pii.landline AS landline_no,
        pii.religion,
        pii.nationality,
        pii.civil_status,
        pii.height,
        pii.weight,
        pii.language_dialects AS language_dialect,
        pii.visual_problems,

        hs.highschool_graduated,
        hs.pubpriv_hs AS pub_priv_hs,
        hs.highschool_address AS hs_school_address,
        hs.hs_final_gwa,

        fam.support,
        fam.parents_income,
        fam.living_in,
        fam.daily_transpo_expense,
        fam.no_siblings,
        fam.ordinal_position,

        ach.awards_honors,
        ach.hobbies_interests,
        ach.future_career,
        ach.acad_extracurr AS acad_clubs_extracurr,

        edu.education_id,
        edu.curriculum_id,
        edu.assignment_id,
        edu.year_id,
        edu.semester_id,
        edu.year_level,
        edu.classification,
        edu.enrollment_status,
        p.program_id,
        p.program_name AS program,
        p.program_abbr,
        p.program_code,
        sec.section_name AS section

      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN student_pii pii ON pii.student_id = s.student_id
      LEFT JOIN student_highschool hs ON hs.student_id = s.student_id
      LEFT JOIN student_family fam ON fam.student_id = s.student_id
      LEFT JOIN student_achievements ach ON ach.student_id = s.student_id
      LEFT JOIN student_education edu ON edu.student_id = s.student_id AND edu.is_current = true
      LEFT JOIN section_assignments sa ON edu.assignment_id = sa.assignment_id
      LEFT JOIN sections sec ON sa.section_id = sec.section_id
      LEFT JOIN curricula c ON c.curriculum_id = edu.curriculum_id
      LEFT JOIN programs p ON p.program_id = c.program_id
      WHERE s.student_id = $1
    `;

    const res = await db.query(mainQuery, [studentId]);
    if (res.rows.length === 0) return null;

    const studentData = res.rows[0];

    // Map Addresses
    const addrRes = await db.query(
      `SELECT * FROM student_addresses WHERE student_id = $1`,
      [studentId]
    );

    addrRes.rows.forEach(addr => {
      if (addr.address_type === 'Present') {
        studentData.present_houseno = addr.house_no;
        studentData.present_street = addr.street;
        studentData.present_sbdvsn_brgy = addr.barangay;
        studentData.present_city_mncplty = addr.city_municipality;
        studentData.perm_house_no = addr.house_no;
        studentData.perm_street = addr.street;
        studentData.perm_barangay = addr.barangay;
        studentData.perm_city = addr.city_municipality;
        studentData.perm_province = addr.province;
      } else if (addr.address_type === 'Provincial') {
        studentData.provincial_houseno = addr.house_no;
        studentData.provincial_street = addr.street;
        studentData.provincial_sbdvsn_brgy = addr.barangay;
        studentData.provincial_city_mncplty = addr.city_municipality;
        studentData.prov_house_no = addr.house_no;
        studentData.prov_street = addr.street;
        studentData.prov_barangay = addr.barangay;
        studentData.prov_city = addr.city_municipality;
        studentData.prov_province = addr.province;
      }
    });

    // Map Family Members
    const membersRes = await db.query(
      `SELECT * FROM student_family_members WHERE student_id = $1`,
      [studentId]
    );

    membersRes.rows.forEach(m => {
      const rel = (m.relation_type || '').toLowerCase();
      if (rel === 'father') {
        studentData.father_firstname = m.first_name;
        studentData.father_middlename = m.middle_name;
        studentData.father_lastname = m.last_name;
        studentData.father_suffix = m.suffix;
        studentData.father_name = [m.first_name, m.middle_name, m.last_name, m.suffix].filter(Boolean).join(' ');
        studentData.father_occupation = m.occupation;
        studentData.father_contact_no = m.contact_no;
        studentData.father_contact = m.contact_no;
        studentData.father_status = m.is_alive ? 'Living' : 'Deceased';
      } else if (rel === 'mother') {
        studentData.mother_firstname = m.first_name;
        studentData.mother_middlename = m.middle_name;
        studentData.mother_lastname = m.last_name;
        studentData.mother_suffix = m.suffix;
        studentData.mother_name = [m.first_name, m.middle_name, m.last_name, m.suffix].filter(Boolean).join(' ');
        studentData.mother_occupation = m.occupation;
        studentData.mother_contact_no = m.contact_no;
        studentData.mother_contact = m.contact_no;
        studentData.mother_status = m.is_alive ? 'Living' : 'Deceased';
      }
    });

    studentData.first_name = studentData.firstname;
    studentData.last_name = studentData.lastname;
    studentData.middle_name = studentData.middlename;

    return studentData;
  }

  static async create(data) {
    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      const studentNumber = data.student_number || data.studentNumber;
      const schoolEmail = data.school_email || data.email || data.personal_email;
      const firstName = data.first_name || data.firstName;
      const lastName = data.last_name || data.lastName;
      const middleName = data.middle_name || data.middleName || null;

      // 1. Create User
      const userRes = await client.query(`
        INSERT INTO users (username, password_hash, school_email, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      `, [
        studentNumber,
        data.password_hash || null,
        schoolEmail || null,
        data.account_status !== undefined ? Boolean(data.account_status) : true
      ]);
      const userId = userRes.rows[0].user_id;

      // Assign Student Role
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, (SELECT role_id FROM roles WHERE UPPER(role_name) = 'STUDENT' LIMIT 1))
        ON CONFLICT DO NOTHING
      `, [userId]);

      // 2. Create Student
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

      // 3. Create Student PII
      await client.query(`
        INSERT INTO student_pii (
          student_id, last_name, first_name, middle_name, suffix, sex,
          birth_place, personal_email, mobile_no, landline, religion,
          nationality, civil_status, height, weight, language_dialects, visual_problems
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        studentId,
        lastName,
        firstName,
        middleName,
        data.suffix || null,
        data.sex || null,
        data.birth_place || data.place_of_birth || data.placeOfBirth || null,
        data.personal_email || data.email || null,
        data.mobile_no || data.phoneNumber || null,
        data.landline || null,
        data.religion || null,
        data.nationality || null,
        data.civil_status || data.civilStatus || null,
        data.height ? parseFloat(data.height) : null,
        data.weight ? parseFloat(data.weight) : null,
        data.language_dialect || data.language_dialects || data.language || null,
        data.visual_problems || data.visualProblems || null
      ]);

      // 4. Addresses
      const presHouse = data.present_houseno || data.perm_house_no || data.house_no;
      const presStreet = data.present_street || data.perm_street || data.street;
      const presBrgy = data.present_sbdvsn_brgy || data.perm_barangay || data.barangay;
      const presCity = data.present_city_mncplty || data.perm_city || data.city_municipality;
      const presProvince = data.perm_province || data.province;

      if (presHouse || presStreet || presBrgy || presCity || presProvince) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province)
          VALUES ($1, 'Present', $2, $3, $4, $5, $6)
        `, [studentId, presHouse || null, presStreet || null, presBrgy || null, presCity || null, presProvince || null]);
      }

      const provHouse = data.provincial_houseno || data.prov_house_no;
      const provStreet = data.provincial_street || data.prov_street;
      const provBrgy = data.provincial_sbdvsn_brgy || data.prov_barangay;
      const provCity = data.provincial_city_mncplty || data.prov_city;
      const provProvince = data.prov_province;

      if (provHouse || provStreet || provBrgy || provCity || provProvince) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province)
          VALUES ($1, 'Provincial', $2, $3, $4, $5, $6)
        `, [studentId, provHouse || null, provStreet || null, provBrgy || null, provCity || null, provProvince || null]);
      }

      // 5. High School Info
      const hsGrad = data.highschool_graduated || data.highschoolGraduated;
      const hsGwa = data.hs_final_gwa || data.hsFinalGWA;
      const hsAddress = data.hs_school_address || data.schoolAddress;
      const pubpriv = data.pub_priv_hs || data.pubprivHS;

      if (hsGrad || hsGwa || hsAddress) {
        await client.query(`
          INSERT INTO student_highschool (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa)
          VALUES ($1, $2, $3, $4, $5)
        `, [studentId, hsGrad || null, pubpriv || null, hsAddress || null, hsGwa ? parseFloat(hsGwa) : null]);
      }

      // 6. Family Members
      if (data.father_name || data.father_firstname) {
        await client.query(`
          INSERT INTO student_family_members (student_id, relation_type, first_name, occupation, contact_no, is_alive, is_guardian)
          VALUES ($1, 'Father', $2, $3, $4, $5, false)
        `, [
          studentId,
          data.father_firstname || data.father_name || null,
          data.father_occupation || null,
          data.father_contact || data.father_contact_no || null,
          data.father_status === 'Living'
        ]);
      }

      if (data.mother_name || data.mother_firstname) {
        await client.query(`
          INSERT INTO student_family_members (student_id, relation_type, first_name, occupation, contact_no, is_alive, is_guardian)
          VALUES ($1, 'Mother', $2, $3, $4, $5, false)
        `, [
          studentId,
          data.mother_firstname || data.mother_name || null,
          data.mother_occupation || null,
          data.mother_contact || data.mother_contact_no || null,
          data.mother_status === 'Living'
        ]);
      }

      // 7. Education Record
      const termInfo = await this.getActiveAcademicTerm(client);
      const programOrCurriculumId = data.curriculum_id || data.program_id;
      
      // Resolve Curriculum ID if program_id was passed
      let curriculumId = programOrCurriculumId;
      if (programOrCurriculumId) {
        const curRes = await client.query(
          `SELECT curriculum_id FROM curricula WHERE program_id = $1 ORDER BY curriculum_id DESC LIMIT 1`,
          [programOrCurriculumId]
        );
        if (curRes.rows.length > 0) curriculumId = curRes.rows[0].curriculum_id;
      }

      const yearLevel = String(data.year_level || data.yearLevel || '1');

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
        yearLevel,
        data.classification || 'Regular',
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

  static async update(studentId, data) {
    const client = db.getClient ? await db.getClient() : db;
    const isDedicatedClient = Boolean(db.getClient);

    try {
      if (isDedicatedClient) await client.query('BEGIN');

      const studentNumber = data.student_number || data.studentNumber;
      const accountStatus = data.account_status !== undefined ? data.account_status : data.accountStatus;
      const schoolEmail = data.school_email || data.email || data.personal_email;

      // 1. Update user record
      if (studentNumber || accountStatus !== undefined || schoolEmail) {
        await client.query(`
          UPDATE users 
          SET 
            username = COALESCE($1, username),
            school_email = COALESCE($2, school_email),
            is_active = COALESCE($3, is_active),
            updated_at = NOW()
          WHERE user_id = (SELECT user_id FROM students WHERE student_id = $4)
        `, [
          studentNumber || null,
          schoolEmail || null,
          accountStatus !== undefined ? Boolean(accountStatus) : null,
          studentId
        ]);
      }

      // 2. Update core student record
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

      // 3. Upsert PII
      await client.query(`
        INSERT INTO student_pii (
          student_id, first_name, last_name, middle_name, suffix, sex,
          birth_place, personal_email, mobile_no, landline, religion,
          nationality, civil_status, height, weight, language_dialects, visual_problems, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          first_name = COALESCE(EXCLUDED.first_name, student_pii.first_name),
          last_name = COALESCE(EXCLUDED.last_name, student_pii.last_name),
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
        data.first_name || data.firstName || null,
        data.last_name || data.lastName || null,
        data.middle_name || data.middleName || null,
        data.suffix || null,
        data.sex || null,
        data.birth_place || data.place_of_birth || data.placeOfBirth || null,
        data.personal_email || data.email || null,
        data.mobile_no || data.phoneNumber || null,
        data.landline || null,
        data.religion || null,
        data.nationality || null,
        data.civil_status || data.civilStatus || null,
        data.height ? parseFloat(data.height) : null,
        data.weight ? parseFloat(data.weight) : null,
        data.language_dialect || data.language_dialects || data.language || null,
        data.visual_problems || data.visualProblems || null
      ]);

      // 4. Upsert Present Address
      const presHouse = data.present_houseno || data.perm_house_no || data.house_no;
      const presStreet = data.present_street || data.perm_street || data.street;
      const presBrgy = data.present_sbdvsn_brgy || data.perm_barangay || data.barangay;
      const presCity = data.present_city_mncplty || data.perm_city || data.city_municipality;
      const presProvince = data.perm_province || data.province;

      if (presHouse || presStreet || presBrgy || presCity || presProvince) {
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
        `, [studentId, presHouse || null, presStreet || null, presBrgy || null, presCity || null, presProvince || null]);
      }

      // 5. Upsert Provincial Address
      const provHouse = data.provincial_houseno || data.prov_house_no;
      const provStreet = data.provincial_street || data.prov_street;
      const provBrgy = data.provincial_sbdvsn_brgy || data.prov_barangay;
      const provCity = data.provincial_city_mncplty || data.prov_city;
      const provProvince = data.prov_province;

      if (provHouse || provStreet || provBrgy || provCity || provProvince) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province, updated_at)
          VALUES ($1, 'Provincial', $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (student_id, address_type) DO UPDATE SET
            house_no = EXCLUDED.house_no,
            street = EXCLUDED.street,
            barangay = EXCLUDED.barangay,
            city_municipality = EXCLUDED.city_municipality,
            province = EXCLUDED.province,
            updated_at = NOW()
        `, [studentId, provHouse || null, provStreet || null, provBrgy || null, provCity || null, provProvince || null]);
      }

      // 6. Upsert Highschool
      const hsGrad = data.highschool_graduated || data.highschoolGraduated;
      const hsGwa = data.hs_final_gwa || data.hsFinalGWA;
      const hsAddress = data.hs_school_address || data.schoolAddress;
      const pubpriv = data.pub_priv_hs || data.pubprivHS;

      if (hsGrad || hsGwa || hsAddress) {
        await client.query(`
          INSERT INTO student_highschool (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (student_id) DO UPDATE SET
            highschool_graduated = EXCLUDED.highschool_graduated,
            pubpriv_hs = EXCLUDED.pubpriv_hs,
            highschool_address = EXCLUDED.highschool_address,
            hs_final_gwa = EXCLUDED.hs_final_gwa,
            updated_at = NOW()
        `, [studentId, hsGrad || null, pubpriv || null, hsAddress || null, hsGwa ? parseFloat(hsGwa) : null]);
      }

      // 7. Safe Family Member Updates (Delete-then-Insert Strategy)
      if (data.father_name || data.father_firstname) {
        await client.query(`DELETE FROM student_family_members WHERE student_id = $1 AND LOWER(relation_type) = 'father'`, [studentId]);
        await client.query(`
          INSERT INTO student_family_members (student_id, relation_type, first_name, occupation, contact_no, is_alive, is_guardian)
          VALUES ($1, 'Father', $2, $3, $4, $5, false)
        `, [
          studentId,
          data.father_firstname || data.father_name || null,
          data.father_occupation || null,
          data.father_contact || data.father_contact_no || null,
          data.father_status === 'Living'
        ]);
      }

      if (data.mother_name || data.mother_firstname) {
        await client.query(`DELETE FROM student_family_members WHERE student_id = $1 AND LOWER(relation_type) = 'mother'`, [studentId]);
        await client.query(`
          INSERT INTO student_family_members (student_id, relation_type, first_name, occupation, contact_no, is_alive, is_guardian)
          VALUES ($1, 'Mother', $2, $3, $4, $5, false)
        `, [
          studentId,
          data.mother_firstname || data.mother_name || null,
          data.mother_occupation || null,
          data.mother_contact || data.mother_contact_no || null,
          data.mother_status === 'Living'
        ]);
      }

      // 8. Update Active Education
      const programOrCurriculumId = data.curriculum_id || data.program_id;
      let curriculumId = programOrCurriculumId;

      if (programOrCurriculumId) {
        const curRes = await client.query(
          `SELECT curriculum_id FROM curricula WHERE program_id = $1 ORDER BY curriculum_id DESC LIMIT 1`,
          [programOrCurriculumId]
        );
        if (curRes.rows.length > 0) curriculumId = curRes.rows[0].curriculum_id;
      }

      const yearLevel = data.year_level || data.yearLevel;

      if (curriculumId || yearLevel || data.classification) {
        await client.query(`
          UPDATE student_education SET
            curriculum_id = COALESCE($1, curriculum_id),
            year_level = COALESCE($2, year_level),
            classification = COALESCE($3, classification),
            updated_at = NOW()
          WHERE student_id = $4 AND is_current = true
        `, [
          curriculumId || null,
          yearLevel ? String(yearLevel) : null,
          data.classification || null,
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

  static async delete(studentId) {
    const res = await db.query(`DELETE FROM students WHERE student_id = $1 RETURNING student_id`, [studentId]);
    return res.rows.length > 0;
  }
}

module.exports = StudentManageModel;