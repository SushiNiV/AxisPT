const { newPool } = require('../config/db');
const pool = newPool; // Use newPool

const StudentModel = {
  // Login - find by student_id
  findById: async (studentID) => {
    const result = await pool.query(
      `SELECT s.student_id, s.birth_date, s.account_status,
              u.password_hash, u.username,
              pii.first_name, pii.last_name
       FROM students s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN student_pii pii ON s.student_id = pii.student_id
       WHERE s.student_id = $1`,
      [studentID]
    );
    return result.rows[0];
  },

  // Registration - create full profile
  createFullProfile: async (data) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Create user account
      const userResult = await client.query(
        `INSERT INTO users (username, password_hash, fatima_email)
         VALUES ($1, $2, $3)
         RETURNING user_id`,
        [data.studentID, data.passwordHash, data.fatimaEmail || null]
      );
      const userId = userResult.rows[0].user_id;

      // 2. Assign Student role
      const roleResult = await client.query(
        `SELECT role_id FROM roles WHERE role_name = 'Student'`
      );
      
      if (roleResult.rows.length > 0) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)`,
          [userId, roleResult.rows[0].role_id]
        );
      }

      // 3. Create student record
      const studentResult = await client.query(
        `INSERT INTO students (user_id, birth_date, account_status)
         VALUES ($1, $2, false)
         RETURNING student_id`,
        [userId, data.dateOfBirth || null]
      );
      const studentId = studentResult.rows[0].student_id;

      // 4. Student PII (Personal Info)
      await client.query(
        `INSERT INTO student_pii (
          student_id, last_name, first_name, middle_name, suffix,
          sex, birth_place, personal_email, mobile_no, landline,
          religion, nationality, civil_status, height, weight,
          language_dialects, visual_problems
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          studentId,
          data.lastName, data.firstName, data.middleName, data.suffix,
          data.sex, data.placeOfBirth, data.email, data.phoneNumber, data.landline,
          data.religion, data.nationality, data.civilStatus,
          data.height ? parseFloat(data.height) : null,
          data.weight ? parseFloat(data.weight) : null,
          data.language, data.visualProblems
        ]
      );

      // 5. Student Addresses (Present)
      await client.query(
        `INSERT INTO student_addresses (
          student_id, address_type, house_no, street, barangay, city_municipality, province
        ) VALUES ($1, 'Present', $2, $3, $4, $5, $6)`,
        [studentId, data.permHouseNo, data.permStreet, data.permSubdivision, data.permCity, null]
      );

      // 6. Student Addresses (Provincial)
      if (!data.sameAsPermanent) {
        await client.query(
          `INSERT INTO student_addresses (
            student_id, address_type, house_no, street, barangay, city_municipality, province
          ) VALUES ($1, 'Provincial', $2, $3, $4, $5, $6)`,
          [studentId, data.provHouseNo, data.provStreet, data.provSubdivision, data.provCity, null]
        );
      } else {
        await client.query(
          `INSERT INTO student_addresses (
            student_id, address_type, house_no, street, barangay, city_municipality, province
          ) VALUES ($1, 'Provincial', $2, $3, $4, $5, $6)`,
          [studentId, data.permHouseNo, data.permStreet, data.permSubdivision, data.permCity, null]
        );
      }

      // 7. Highschool Info
      await client.query(
        `INSERT INTO student_highschool (
          student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          studentId,
          data.highschoolGraduated,
          data.pubprivHS,
          data.schoolAddress,
          data.hsFinalGWA ? parseFloat(data.hsFinalGWA) : null
        ]
      );

      // 8. Family Members (Father)
      if (data.fatherFirstName) {
        await client.query(
          `INSERT INTO student_family_members (
            student_id, relation_type, first_name, middle_name, last_name, suffix,
            occupation, contact_no, is_alive, is_guardian
          ) VALUES ($1, 'Father', $2, $3, $4, $5, $6, $7, $8, false)`,
          [
            studentId,
            data.fatherFirstName, data.fatherMiddleName, data.fatherLastName,
            data.fatherSuffix, data.fatherOccupation, data.fatherContactNumber,
            data.fatherStatus?.toLowerCase() === 'living'
          ]
        );
      }

      // 9. Family Members (Mother)
      if (data.motherFirstName) {
        await client.query(
          `INSERT INTO student_family_members (
            student_id, relation_type, first_name, middle_name, last_name, suffix,
            occupation, contact_no, is_alive, is_guardian
          ) VALUES ($1, 'Mother', $2, $3, $4, $5, $6, $7, $8, false)`,
          [
            studentId,
            data.motherFirstName, data.motherMiddleName, data.motherLastName,
            data.motherSuffix, data.motherOccupation, data.motherContactNumber,
            data.motherStatus?.toLowerCase() === 'living'
          ]
        );
      }

    
      if (data.guardianFirstName) {
        await client.query(
          `INSERT INTO student_family_members (
            student_id, relation_type, first_name, middle_name, last_name, suffix,
            occupation, contact_no, is_alive, is_guardian
          ) VALUES ($1, 'Guardian', $2, $3, $4, $5, $6, $7, true, true)`,
          [
            studentId,
            data.guardianFirstName, data.guardianMiddleName, data.guardianLastName,
            data.guardianSuffix, data.guardianRelationship, data.guardianContactNumber
          ]
        );
      }

      // 11. Student Family Info
      await client.query(
        `INSERT INTO student_family (
          student_id, support, parents_income, living_in,
          daily_transpo_expense, no_siblings, ordinal_position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          studentId,
          Array.isArray(data.support) ? data.support.join(', ') : data.support,
          data.parentsIncome,
          data.livingArrangement,
          data.transportExpense,
          data.numSiblings ? parseInt(data.numSiblings) : null,
          data.ordinalPosition ? parseInt(data.ordinalPosition) : null
        ]
      );

      // 12. Student Achievements
      await client.query(
        `INSERT INTO student_achievements (
          student_id, awards_honors, hobbies_interests, future_career, acad_extracurr
        ) VALUES ($1, $2, $3, $4, $5)`,
        [studentId, data.awards, data.interests, data.careerGoal, data.extracurricular]
      );

      await client.query('COMMIT');
      return { studentId, userId };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Update password
  updatePassword: async (studentID, passwordHash) => {
    // Find user_id from student_id
    const student = await pool.query(
      'SELECT user_id FROM students WHERE student_id = $1',
      [studentID]
    );
    
    if (student.rows.length === 0) return 0;
    
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, changed_pass = true, updated_at = NOW()
       WHERE user_id = $2`,
      [passwordHash, student.rows[0].user_id]
    );
    return result.rowCount;
  }
};

module.exports = StudentModel;