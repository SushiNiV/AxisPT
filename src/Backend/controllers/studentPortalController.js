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

    // Fetch components for each grade
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
// GET MY PROFILE
// ==========================================
exports.getMyProfile = async (req, res) => {
  const { student_id } = req.user;
  try {
    const result = await db.query(`
      SELECT
        s.student_id, s.birth_date, s.account_status,
        u.username AS student_number, u.school_email,
        p.first_name, p.middle_name, p.last_name, p.suffix,
        p.sex, p.birth_place, p.personal_email, p.mobile_no, p.landline,
        p.religion, p.nationality, p.civil_status, p.height, p.weight,
        p.language_dialects, p.visual_problems,
        se.year_level, se.classification, se.enrollment_status,
        prog.program_abbr, prog.program_name
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN student_pii p ON p.student_id = s.student_id
      LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
      LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
      LEFT JOIN programs prog ON prog.program_id = c.program_id
      WHERE s.student_id = $1
    `, [student_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==========================================
// UPDATE MY PROFILE (only self-service fields)
// ==========================================
exports.updateMyProfile = async (req, res) => {
  const { student_id } = req.user;
  const {
    personal_email, mobile_no, landline, religion,
    nationality, civil_status, height, weight,
    language_dialects, visual_problems,
    // addresses
    present_houseno, present_street, present_barangay,
    present_city, present_province,
    provincial_houseno, provincial_street, provincial_barangay,
    provincial_city, provincial_province,
  } = req.body;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update PII
    await client.query(`
      UPDATE student_pii SET
        personal_email = COALESCE($1, personal_email),
        mobile_no = COALESCE($2, mobile_no),
        landline = COALESCE($3, landline),
        religion = COALESCE($4, religion),
        nationality = COALESCE($5, nationality),
        civil_status = COALESCE($6, civil_status),
        height = COALESCE($7, height),
        weight = COALESCE($8, weight),
        language_dialects = COALESCE($9, language_dialects),
        visual_problems = COALESCE($10, visual_problems),
        updated_at = NOW()
      WHERE student_id = $11
    `, [
      personal_email || null, mobile_no || null, landline || null,
      religion || null, nationality || null, civil_status || null,
      height || null, weight || null, language_dialects || null,
      visual_problems || null, student_id,
    ]);

    // Upsert Present Address
    if (present_houseno || present_street || present_barangay || present_city || present_province) {
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
      `, [student_id, present_houseno || null, present_street || null, present_barangay || null, present_city || null, present_province || null]);
    }

    // Upsert Provincial Address
    if (provincial_houseno || provincial_street || provincial_barangay || provincial_city || provincial_province) {
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
      `, [student_id, provincial_houseno || null, provincial_street || null, provincial_barangay || null, provincial_city || null, provincial_province || null]);
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