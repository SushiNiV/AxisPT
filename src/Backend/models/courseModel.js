const db = require('../config/db');

class CourseModel {
  static async getAll() {
    const result = await db.query(`
      SELECT DISTINCT ON (c.course_id)
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
        p.program_name,
        cc.year_level,
        s.semester_label
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      ORDER BY c.course_id, cc.created_at DESC
    `);
    return result.rows;
  }

  static async getById(courseId) {
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
        c.prerequisites,
        p.program_name,
        cc.year_level,
        s.semester_label,
        cc.curriculum_id
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      WHERE c.course_id = $1
    `, [courseId]);
    return result.rows[0];
  }

  static async getByCode(courseCode) {
    const result = await db.query(`
      SELECT * FROM courses WHERE course_code = $1
    `, [courseCode]);
    return result.rows[0];
  }

  static async create(courseData) {
    const { course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites } = courseData;
    const result = await db.query(`
      INSERT INTO courses (course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites || null]);
    return result.rows[0];
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