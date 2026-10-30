const db = require('../config/db');

// ==========================================
// GET MY GRADES
// ==========================================
exports.getMyGrades = async (req, res) => {
  const { student_id } = req.user;
  try {
    const result = await db.query(`
      SELECT
        g.grade_id,
        g.final_grade,
        g.remarks,
        g.year_id,
        g.semester_id,
        g.year_level,
        c.course_code,
        c.course_name,
        c.lec_units,
        c.lab_units,
        ay.year_label,
        sem.semester_label
      FROM grades g
      JOIN courses c ON c.course_id = g.course_id
      LEFT JOIN academic_year ay ON ay.year_id = g.year_id
      LEFT JOIN semester sem ON sem.semester_id = g.semester_id
      WHERE g.student_id = $1
      ORDER BY g.year_id DESC, g.semester_id DESC, c.course_code
    `, [student_id]);

    const gradeIds = result.rows.map(r => r.grade_id);
    let componentsByGrade = {};
    if (gradeIds.length > 0) {
      const compRes = await db.query(`
        SELECT grade_id, term, component_name, score, percentage
        FROM grade_components
        WHERE grade_id = ANY($1)
        ORDER BY grade_id, term, component_name
      `, [gradeIds]);
      compRes.rows.forEach(c => {
        if (!componentsByGrade[c.grade_id]) componentsByGrade[c.grade_id] = [];
        componentsByGrade[c.grade_id].push(c);
      });
    }

    const data = result.rows.map(r => ({
      ...r,
      components: componentsByGrade[r.grade_id] || [],
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==========================================
// GET MY CURRENT SUBJECTS
// ==========================================
exports.getMySubjects = async (req, res) => {
  const { student_id } = req.user;
  try {
    const eduRes = await db.query(`
      SELECT curriculum_id, year_level, semester_id, year_id
      FROM student_education
      WHERE student_id = $1 AND is_current = true
      LIMIT 1
    `, [student_id]);

    if (eduRes.rows.length === 0) {
      return res.json({ success: true, data: { enrolled: [], education: null } });
    }

    const edu = eduRes.rows[0];

    const coursesRes = await db.query(`
      SELECT
        cc.id AS curriculum_course_id,
        c.course_id,
        c.course_code,
        c.course_name,
        c.lec_units,
        c.lab_units,
        c.course_desc,
        sec.section_name,
        f.first_name AS faculty_first_name,
        f.last_name AS faculty_last_name,
        sem.semester_label,
        ay.year_label
      FROM curriculum_courses cc
      JOIN courses c ON c.course_id = cc.course_id
      LEFT JOIN student_education se ON se.student_id = $1 AND se.is_current = true
      LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
      LEFT JOIN sections sec ON sec.section_id = sa.section_id
      LEFT JOIN faculties f ON f.faculty_id = sa.adviser_id
      LEFT JOIN semester sem ON sem.semester_id = cc.semester_id
      LEFT JOIN academic_year ay ON ay.year_id = se.year_id
      WHERE cc.curriculum_id = $2
        AND cc.year_level = $3
        AND cc.semester_id = $4
      ORDER BY c.course_code
    `, [student_id, edu.curriculum_id, edu.year_level, edu.semester_id]);

    res.json({
      success: true,
      data: {
        education: edu,
        enrolled: coursesRes.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==========================================
// PROFILE HELPERS
// ==========================================
const clean = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v.trim() === '' ? null : v.trim();
  return v;
};
const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// ==========================================
// GET MY PROFILE
// ==========================================
exports.getMyProfile = async (req, res) => {
  const { student_id } = req.user;
  try {
    const result = await db.query(`
      SELECT
        s.student_id, s.birth_date, s.account_status, s.standing,
        u.username AS student_number, u.school_email,
        p.first_name, p.middle_name, p.last_name, p.suffix,
        p.sex, p.birth_place AS place_of_birth, p.personal_email, p.mobile_no, p.landline,
        p.religion, p.nationality, p.civil_status, p.height, p.weight,
        p.language_dialects, p.visual_problems,

        hs.highschool_graduated, hs.pubpriv_hs AS pub_priv_hs,
        hs.highschool_address AS hs_school_address, hs.hs_final_gwa,

        fam.support, fam.parents_income, fam.living_in,
        fam.daily_transpo_expense, fam.no_siblings, fam.ordinal_position,

        ach.awards_honors, ach.hobbies_interests, ach.future_career, ach.acad_extracurr,

        se.year_level, se.classification, se.enrollment_status,
        prog.program_abbr, prog.program_name,
        sec.section_name AS section
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN student_pii p ON p.student_id = s.student_id
      LEFT JOIN student_highschool hs ON hs.student_id = s.student_id
      LEFT JOIN student_family fam ON fam.student_id = s.student_id
      LEFT JOIN student_achievements ach ON ach.student_id = s.student_id
      LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
      LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
      LEFT JOIN sections sec ON sec.section_id = sa.section_id
      LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
      LEFT JOIN programs prog ON prog.program_id = c.program_id
      WHERE s.student_id = $1
    `, [student_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    const data = result.rows[0];

    const addrRes = await db.query('SELECT * FROM student_addresses WHERE student_id = $1', [student_id]);
    addrRes.rows.forEach((a) => {
      if (a.address_type === 'Present') {
        data.perm_house_no = a.house_no;
        data.perm_street = a.street;
        data.perm_barangay = a.barangay;
        data.perm_city = a.city_municipality;
        data.perm_province = a.province;
      } else if (a.address_type === 'Provincial') {
        data.prov_house_no = a.house_no;
        data.prov_street = a.street;
        data.prov_barangay = a.barangay;
        data.prov_city = a.city_municipality;
        data.prov_province = a.province;
      }
    });

    const memRes = await db.query('SELECT * FROM student_family_members WHERE student_id = $1', [student_id]);
    memRes.rows.forEach((m) => {
      const rel = (m.relation_type || '').toLowerCase();
      if (!['father', 'mother', 'guardian'].includes(rel)) return;
      data[`${rel}_firstname`] = m.first_name;
      data[`${rel}_middlename`] = m.middle_name;
      data[`${rel}_lastname`] = m.last_name;
      data[`${rel}_suffix`] = m.suffix;
      data[`${rel}_occupation`] = m.occupation;
      data[`${rel}_contact`] = m.contact_no;
      if (rel !== 'guardian') data[`${rel}_status`] = m.is_alive ? 'Living' : 'Deceased';
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==========================================
// UPDATE MY PROFILE
// ==========================================
exports.updateMyProfile = async (req, res) => {
  const { student_id } = req.user;
  const body = req.body || {};
  const has = (...keys) => keys.some((k) => Object.prototype.hasOwnProperty.call(body, k));
  const first = (...keys) => {
    for (const k of keys) { const v = clean(body[k]); if (v !== null) return v; }
    return null;
  };

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Update students table (Birth Date)
    if (has('birth_date')) {
      await client.query(
        `UPDATE students SET birth_date = $1, updated_at = NOW() WHERE student_id = $2`,
        [clean(body.birth_date), student_id]
      );
    }

    // 2. Update users table (Student Number / Username)
    if (has('student_number')) {
      await client.query(
        `UPDATE users SET username = $1, updated_at = NOW() 
         WHERE user_id = (SELECT user_id FROM students WHERE student_id = $2)`,
        [clean(body.student_number), student_id]
      );
    }

    // 3. Update student_pii (Identity & Personal Info)
    const piiMap = {
      first_name: ['first_name', clean],
      middle_name: ['middle_name', clean],
      last_name: ['last_name', clean],
      suffix: ['suffix', clean],
      sex: ['sex', clean],
      
      personal_email: ['personal_email', clean],
      place_of_birth: ['birth_place', clean],
      mobile_no: ['mobile_no', clean],
      landline: ['landline', clean],
      religion: ['religion', clean],
      nationality: ['nationality', clean],
      civil_status: ['civil_status', clean],
      height: ['height', num],
      weight: ['weight', num],
      language_dialects: ['language_dialects', clean],
      visual_problems: ['visual_problems', clean],
    };
    
    const sets = [];
    const vals = [];
    for (const [key, [col, fn]] of Object.entries(piiMap)) {
      if (has(key)) { 
        // Prevent NOT NULL constraint violations by defaulting to empty string if null
        let val = fn(body[key]);
        if (val === null && ['first_name', 'last_name'].includes(key)) val = '';
        vals.push(val); 
        sets.push(`${col} = $${vals.length}`); 
      }
    }
    if (sets.length) {
      vals.push(student_id);
      await client.query(
        `UPDATE student_pii SET ${sets.join(', ')}, updated_at = NOW() WHERE student_id = $${vals.length}`,
        vals
      );
    }

    // 4. Update Addresses
    const saveAddress = async (type, keys, a) => {
      if (!has(...keys)) return;
      if (Object.values(a).some((v) => v !== null)) {
        await client.query(`
          INSERT INTO student_addresses (student_id, address_type, house_no, street, barangay, city_municipality, province, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (student_id, address_type) DO UPDATE SET
            house_no = EXCLUDED.house_no, street = EXCLUDED.street, barangay = EXCLUDED.barangay,
            city_municipality = EXCLUDED.city_municipality, province = EXCLUDED.province, updated_at = NOW()
        `, [student_id, type, a.house, a.street, a.barangay, a.city, a.province]);
      } else {
        await client.query('DELETE FROM student_addresses WHERE student_id = $1 AND address_type = $2', [student_id, type]);
      }
    };

    await saveAddress('Present',
      ['present_houseno', 'perm_house_no', 'present_street', 'perm_street', 'present_barangay', 'perm_barangay', 'present_city', 'perm_city', 'perm_province', 'present_province'],
      {
        house: first('present_houseno', 'perm_house_no'),
        street: first('present_street', 'perm_street'),
        barangay: first('present_barangay', 'present_sbdvsn_brgy', 'perm_barangay'),
        city: first('present_city', 'present_city_mncplty', 'perm_city'),
        province: first('present_province', 'perm_province'),
      });

    await saveAddress('Provincial',
      ['provincial_houseno', 'prov_house_no', 'provincial_street', 'prov_street', 'provincial_barangay', 'prov_barangay', 'provincial_city', 'prov_city', 'provincial_province', 'prov_province'],
      {
        house: first('provincial_houseno', 'prov_house_no'),
        street: first('provincial_street', 'prov_street'),
        barangay: first('provincial_barangay', 'provincial_sbdvsn_brgy', 'prov_barangay'),
        city: first('provincial_city', 'provincial_city_mncplty', 'prov_city'),
        province: first('provincial_province', 'prov_province'),
      });

    // 5. High school
    if (has('highschool_graduated', 'pub_priv_hs', 'hs_school_address', 'hs_final_gwa')) {
      await client.query(`
        INSERT INTO student_highschool (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          highschool_graduated = EXCLUDED.highschool_graduated, pubpriv_hs = EXCLUDED.pubpriv_hs,
          highschool_address = EXCLUDED.highschool_address, hs_final_gwa = EXCLUDED.hs_final_gwa, updated_at = NOW()
      `, [student_id, clean(body.highschool_graduated), first('pub_priv_hs', 'pubpriv_hs'), first('hs_school_address', 'highschool_address'), num(body.hs_final_gwa)]);
    }

    // 6. Parents / guardian
    const saveMember = async (relation, prefix, isGuardian) => {
      if (!has(`${prefix}_firstname`, `${prefix}_lastname`, `${prefix}_occupation`, `${prefix}_contact`)) return;
      const m = {
        first: clean(body[`${prefix}_firstname`]),
        middle: clean(body[`${prefix}_middlename`]),
        last: clean(body[`${prefix}_lastname`]),
        suffix: clean(body[`${prefix}_suffix`]),
        occupation: clean(body[`${prefix}_occupation`]),
        contact: first(`${prefix}_contact`, `${prefix}_contact_no`),
      };
      const prev = await client.query(
        'SELECT is_alive FROM student_family_members WHERE student_id = $1 AND relation_type = $2 LIMIT 1',
        [student_id, relation]
      );
      await client.query('DELETE FROM student_family_members WHERE student_id = $1 AND relation_type = $2', [student_id, relation]);
      if (!Object.values(m).some((v) => v !== null)) return;

      const status = body[`${prefix}_status`];
      const alive = isGuardian ? true
        : status === 'Living' ? true
        : status === 'Deceased' ? false
        : (prev.rows[0]?.is_alive ?? true);

      await client.query(`
        INSERT INTO student_family_members
          (student_id, relation_type, first_name, middle_name, last_name, suffix, occupation, contact_no, is_alive, is_guardian)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [student_id, relation, m.first, m.middle, m.last, m.suffix, m.occupation, m.contact, alive, isGuardian]);
    };
    await saveMember('Father', 'father', false);
    await saveMember('Mother', 'mother', false);
    await saveMember('Guardian', 'guardian', true);

    // 7. Family background
    if (has('support', 'parents_income', 'living_in', 'daily_transpo_expense', 'no_siblings', 'ordinal_position')) {
      const sib = clean(body.no_siblings);
      await client.query(`
        INSERT INTO student_family (student_id, support, parents_income, living_in, daily_transpo_expense, no_siblings, ordinal_position, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          support = EXCLUDED.support, parents_income = EXCLUDED.parents_income, living_in = EXCLUDED.living_in,
          daily_transpo_expense = EXCLUDED.daily_transpo_expense, no_siblings = EXCLUDED.no_siblings,
          ordinal_position = EXCLUDED.ordinal_position, updated_at = NOW()
      `, [student_id, clean(body.support), clean(body.parents_income), clean(body.living_in),
          clean(body.daily_transpo_expense), sib === null ? null : parseInt(sib, 10), clean(body.ordinal_position)]);
    }

    // 8. Achievements
    if (has('awards_honors', 'hobbies_interests', 'future_career', 'acad_extracurr')) {
      await client.query(`
        INSERT INTO student_achievements (student_id, awards_honors, hobbies_interests, future_career, acad_extracurr, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (student_id) DO UPDATE SET
          awards_honors = EXCLUDED.awards_honors, hobbies_interests = EXCLUDED.hobbies_interests,
          future_career = EXCLUDED.future_career, acad_extracurr = EXCLUDED.acad_extracurr, updated_at = NOW()
      `, [student_id, clean(body.awards_honors), clean(body.hobbies_interests), clean(body.future_career), clean(body.acad_extracurr)]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  } finally {
    client.release();
  }
};