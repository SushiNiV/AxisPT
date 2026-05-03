const pool = require('../config/db');

const StudentModel = {

  //need pala mag add ng log action, pero test muna kung gumagana yung login hohohoho
  //login
  findById: async (studentID) => {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [studentID]);
    return result.rows[0];
  },



  //registration
  createFullProfile: async (data, plainPassword) => {
    const sanitize = (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim().toLowerCase();
        if (trimmed === "" || trimmed === "n/a" || trimmed === "none" || trimmed === "not applicable") {
          return null;
        }
      }
      if (val === undefined || val === null) {
        return null;
      }
      return val;
    };

    const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const studentQuery = `
        INSERT INTO students (
          student_id,
          password_hash,
          birth_date,
          account_status,
          must_change_password
        )
        VALUES ($1, $2, $3, $4, $5)`;

        const studentValue = [
          data.studentID,
          plainPassword,
          data.dateOfBirth,
          false,
          true
        ].map(sanitize);
        await client.query(studentQuery, studentValue);

        const piiQuery = `
        INSERT INTO student_pii (
          student_id,
          firstname,
          lastname,
          middlename,
          suffix,
          sex,
          birth_place,
          email,
          mobile_no,
          landline_no,
          religion,
          nationality,
          civil_status,
          height,
          weight,
          language_dialects,
          visual_problems,
          present_houseno,
          present_street,
          present_sbdvsn_brgy,
          present_city_mncplty,
          provincial_houseno,
          provincial_street,
          provincial_sbdvsn_brgy,
          provincial_city_mncplty
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`;

        const piiValues = [
          data.studentID,
          data.firstName,
          data.lastName,
          data.middleName,
          data.suffix,
          data.sex,
          data.placeOfBirth,
          data.email,
          data.phoneNumber,
          data.landline,
          data.religion,
          data.nationality,
          data.civilStatus,
          data.height,
          data.weight,
          data.language,
          data.visualProblems,
          data.permHouseNo,
          data.permStreet,
          data.permSubdivision,
          data.permCity,
          data.provHouseNo,
          data.provStreet,
          data.provSubdivision,
          data.provCity
        ].map(sanitize);
        await client.query(piiQuery, piiValues);
        
        const educQuery = `
        INSERT INTO student_education (
          student_id,
          program,
          classification,
          year_level,
          section,
          acad_year,
          semester,
          highschool_graduated,
          pubpriv_hs,
          highschool_address,
          hs_final_gwa
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

        const educValues = [
          data.studentID,
          data.program,
          data.classification,
          data.yearLevel,
          data.section,
          data.acadYear,
          data.semester,
          data.highschoolGraduated,
          data.pubprivHS,
          data.schoolAddress,
          data.hsFinalGWA
        ].map(sanitize);
        await client.query(educQuery, educValues);

        const familyQuery = `
        INSERT INTO student_family (
          student_id,
          father_firstname,
          father_lastname,
          father_middlename,
          father_suffix,
          father_alive,
          father_occupation,
          father_contact_no,
          mother_firstname,
          mother_lastname,
          mother_middlename,
          mother_suffix,
          mother_alive,
          mother_occupation,
          mother_contact_no,
          guardian_firstname,
          guardian_lastname,
          guardian_middlename,
          guardian_suffix,
          guardian_relation,
          guardian_contact_no,
          support,
          parents_income,
          living_in,
          daily_transpo_expense,
          no_siblings,
          ordinal_position
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`;

        const familyValues = [
          data.studentID,
          data.fatherFirstName,
          data.fatherLastName,
          data.fatherMiddleName,
          data.fatherSuffix,
          data.fatherStatus,
          data.fatherOccupation,
          data.fatherContactNumber,
          data.motherFirstName,
          data.motherLastName,
          data.motherMiddleName,
          data.motherSuffix,
          data.motherStatus,
          data.motherOccupation,
          data.motherContactNumber,
          data.guardianFirstName,
          data.guardianLastName,
          data.guardianMiddleName,
          data.guardianSuffix,
          data.guardianRelationship,
          data.guardianContactNumber,
          data.support,
          data.parentsIncome,
          data.livingArrangement,
          data.transportExpense,
          data.numSiblings,
          data.ordinalPosition
        ].map(sanitize);
        await client.query(familyQuery, familyValues);

        const interestsQuery = `
        INSERT INTO student_achievements_interest (
          student_id,
          awards_honors,
          hobbies_interests,
          future_career,
          acad_clubs_extracurr
        ) 
        VALUES ($1, $2, $3, $4, $5)`;

        const interestValues = [
          data.studentID,
          data.awards,
          data.interests,
          data.careerGoal,
          data.extracurricular
        ].map(sanitize);
        await client.query(interestsQuery, interestValues);

        const historyQuery = `
        INSERT INTO history_transactions (
          user_id,
          user_role,
          user_designation,
          action,
          target_id,
          details
        ) 
        VALUES ($1, $2, $3, $4, $5, $6)`;

        const historyValues = [
          data.studentID,
          'Student',
          'Student',
          'STUDENT REGISTRATION',
          data.studentID,
          `Initial registration for ${data.firstName} ${data.middleName} ${data.lastName} ${data.suffix}`
        ];
        await client.query(historyQuery, historyValues);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  updatePassword: async (studentID, passwordHash) => {
    const result = await pool.query(
      'UPDATE students SET password_hash = $1, must_change_password = false WHERE student_id = $2',
      [passwordHash, studentID]
    );
    return result.rowCount;
  }
};

module.exports = StudentModel;