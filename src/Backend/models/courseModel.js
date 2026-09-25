const db = require('../config/db');

class CourseModel {
  static async getAll() {
    const result = await db.query(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.lec_units,
        c.lab_units,
        c.total_units,
        c.course_desc,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.prerequisites,
        c.grading_scheme,
        array_agg(DISTINCT p.program_abbr) FILTER (WHERE p.program_abbr IS NOT NULL) AS program_abbrs,
        (SELECT year_level FROM curriculum_courses WHERE course_id = c.course_id LIMIT 1) AS year_level,
        (SELECT semester_label FROM semester WHERE semester_id = (SELECT semester_id FROM curriculum_courses WHERE course_id = c.course_id LIMIT 1)) AS semester_label
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      GROUP BY c.course_id
      ORDER BY c.course_code ASC
    `);

    // Resolve prerequisites from comma-separated IDs/codes to a
    // comma-separated string of course codes for display.
    // Handles both formats stored in the DB (legacy codes and new IDs).
    const rows = result.rows;
    const allPrereqTokens = new Set();
    const parsed = rows.map((row) => {
      const str = (row.prerequisites || '').trim();
      if (!str) return { ...row, prerequisite_codes: '' };

      const parts = str.split(',').map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => allPrereqTokens.add(p));
      return { ...row, _prereqParts: parts };
    });

    // Split tokens into numeric IDs vs string codes.
    const numericIds = [];
    const stringCodes = [];
    for (const token of allPrereqTokens) {
      if (/^\d+$/.test(token)) numericIds.push(Number(token));
      else stringCodes.push(token);
    }

    // Look up whichever tokens are numeric IDs.
    const idToCode = new Map();
    if (numericIds.length > 0) {
      const idRes = await db.query(
        `SELECT course_id, course_code FROM courses WHERE course_id = ANY($1::int[])`,
        [numericIds]
      );
      idRes.rows.forEach((r) => idToCode.set(String(r.course_id), r.course_code));
    }

    // Any string tokens are already course codes.
    for (const code of stringCodes) idToCode.set(code, code);

    // Build the final `prerequisite_codes` string per row.
    return parsed.map((row) => {
      const { _prereqParts, ...clean } = row;
      const codes = (_prereqParts || [])
        .map((tok) => idToCode.get(tok) || tok)
        .filter(Boolean);
      return { ...clean, prerequisite_codes: codes.join(', ') };
    });
  }

  static async getById(courseId) {
  const courseResult = await db.query(`
    SELECT 
      c.course_id,
      c.course_code,
      c.course_name,
      c.lec_units,
      c.lab_units,
      c.total_units,
      c.course_desc,
      c.is_active,
      c.prerequisites,
      c.grading_scheme,
      c.created_at,
      c.updated_at
    FROM courses c
    WHERE c.course_id = $1
  `, [courseId]);

  const course = courseResult.rows[0];
  if (!course) return null;

  // Parse prerequisites into an array of course IDs (numbers)
  if (course.prerequisites) {
    let prereqStr = course.prerequisites;
    // Remove possible curly braces from PostgreSQL array literal
    prereqStr = prereqStr.replace(/^{|}$/g, '');
    // Split by comma
    const parts = prereqStr.split(',').map(s => s.trim()).filter(Boolean);
    // Try to convert each part to number; if NaN, it's a course code
    const idsOrCodes = parts.map(p => {
      const num = Number(p);
      return isNaN(num) ? p : num;
    });
    // Now we need to convert codes to IDs by querying the courses table
    // Separate numbers and strings
    const numericIds = idsOrCodes.filter(p => typeof p === 'number');
    const stringCodes = idsOrCodes.filter(p => typeof p === 'string');
    let allIds = [...numericIds];
    if (stringCodes.length > 0) {
      // Query for these codes
      const placeholders = stringCodes.map((_, i) => `$${i+1}`).join(',');
      const res = await db.query(
        `SELECT course_id FROM courses WHERE course_code IN (${placeholders})`,
        stringCodes
      );
      const codeIds = res.rows.map(r => r.course_id);
      allIds = [...allIds, ...codeIds];
    }
    course.prerequisites = allIds;
  } else {
    course.prerequisites = [];
  }

  // Fetch assignments
  const assignments = await this.getAssignments(courseId);
  course.assignments = assignments;

  return course;
}

  static async getAssignments(courseId) {
    const result = await db.query(`
      SELECT 
        cc.curriculum_id,
        cc.year_level,
        cc.semester_id,
        cur.program_id,
        p.program_name,
        p.program_abbr,
        cur.version_name,
        cur.start_year,
        s.semester_label
      FROM curriculum_courses cc
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      WHERE cc.course_id = $1
    `, [courseId]);
    return result.rows;
  }

  static async getByCode(courseCode) {
    const result = await db.query(`
      SELECT * FROM courses WHERE course_code = $1
    `, [courseCode]);
    return result.rows[0];
  }

  static async create(courseData) {
    const { course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites } = courseData;
    // ✅ Convert array to comma-separated string
    const prereqStr = Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites || null;
    const result = await db.query(`
      INSERT INTO courses (course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [course_code, course_name, lec_units, lab_units, course_desc, is_active, prereqStr]);
    return result.rows[0];
  }

  static async update(courseId, courseData) {
    const { course_code, course_name, lec_units, lab_units, course_desc, prerequisites, grading_scheme } = courseData;
    // ✅ Convert array to comma-separated string
    const prereqStr = Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites || null;
    const result = await db.query(`
      UPDATE courses
      SET course_code = $1,
          course_name = $2,
          lec_units = $3,
          lab_units = $4,
          course_desc = $5,
          prerequisites = $6,
          grading_scheme = $7,
          updated_at = NOW()
      WHERE course_id = $8
      RETURNING *
    `, [course_code, course_name, lec_units, lab_units, course_desc, prereqStr, grading_scheme || null, courseId]);
    return result.rows[0];
  }

  static async delete(courseId) {
    const result = await db.query(`DELETE FROM courses WHERE course_id = $1`, [courseId]);
    return result.rowCount > 0;
  }

  static async addToCurriculum(curriculumId, courseId, yearLevel, semesterId) {
    const result = await db.query(`
      INSERT INTO curriculum_courses (curriculum_id, course_id, year_level, semester_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (curriculum_id, course_id) DO UPDATE 
      SET year_level = EXCLUDED.year_level, semester_id = EXCLUDED.semester_id
      RETURNING id
    `, [curriculumId, courseId, yearLevel, semesterId]);
    return result.rows[0];
  }
}

module.exports = CourseModel;