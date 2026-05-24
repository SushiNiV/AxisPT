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
        p.program_name,
        cc.year_level,
        s.semester_label,
        STRING_AGG(DISTINCT prereq.course_code, ', ') as prerequisites
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      LEFT JOIN curriculum_course_prerequisites ccp ON cc.id = ccp.curriculum_course_id
      LEFT JOIN courses prereq ON ccp.prerequisite_course_id = prereq.course_id
      GROUP BY 
        c.course_id, c.course_code, c.course_name, 
        c.lec_units, c.lab_units, c.total_units, 
        c.course_desc, c.is_active, c.created_at, c.updated_at,
        p.program_name, cc.year_level, s.semester_label, cc.created_at
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
        p.program_name,
        cc.year_level,
        s.semester_label,
        cc.curriculum_id,
        STRING_AGG(DISTINCT prereq.course_code, ', ') as prerequisites
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      LEFT JOIN curriculum_course_prerequisites ccp ON cc.id = ccp.curriculum_course_id
      LEFT JOIN courses prereq ON ccp.prerequisite_course_id = prereq.course_id
      WHERE c.course_id = $1
      GROUP BY 
        c.course_id, c.course_code, c.course_name, 
        c.lec_units, c.lab_units, c.total_units, 
        c.course_desc, c.is_active,
        p.program_name, cc.year_level, s.semester_label, cc.curriculum_id
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
    const { course_code, course_name, lec_units, lab_units, course_desc, is_active } = courseData;
    const result = await db.query(`
      INSERT INTO courses (course_code, course_name, lec_units, lab_units, course_desc, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [course_code, course_name, lec_units, lab_units, course_desc, is_active]);
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