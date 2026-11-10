const db = require('../config/db');

// "1,2" (or a legacy "{1,2}") -> ['1', '2']. getAll and getById each had their own
// copy of this parsing, and only getById handled the braces.
const parsePrereqTokens = (value) =>
  String(value ?? '').replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean);

const isNumericToken = (t) => /^\d+$/.test(t);

const toPrereqString = (prerequisites) =>
  Array.isArray(prerequisites) ? prerequisites.join(',') : prerequisites || null;

// Every method that writes takes an optional `client` so it can join a transaction.
class CourseModel {
  static async getAll(includeArchived = false) {
    const { rows } = await db.query(`
      SELECT
        c.course_id, c.course_code, c.course_name, c.lec_units, c.lab_units, c.total_units,
        c.course_desc, c.is_active, c.is_archived, c.archived_at, c.created_at, c.updated_at,
        c.prerequisites, c.grading_scheme,
        array_agg(DISTINCT p.program_abbr) FILTER (WHERE p.program_abbr IS NOT NULL) AS program_abbrs,
        (
          SELECT json_agg(json_build_object(
            'curriculum_id', cc2.curriculum_id,
            'program_abbr', p2.program_abbr,
            'year_level', cc2.year_level,
            'semester_label', s2.semester_label
          ) ORDER BY cc2.year_level, s2.semester_label)
          FROM curriculum_courses cc2
          LEFT JOIN curricula cur2 ON cc2.curriculum_id = cur2.curriculum_id
          LEFT JOIN programs p2 ON cur2.program_id = p2.program_id
          LEFT JOIN semester s2 ON cc2.semester_id = s2.semester_id
          WHERE cc2.course_id = c.course_id
        ) AS assignments
      FROM courses c
      LEFT JOIN curriculum_courses cc ON c.course_id = cc.course_id
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      ${includeArchived ? '' : 'WHERE c.is_archived = false OR c.is_archived IS NULL'}
      GROUP BY c.course_id
      ORDER BY c.course_code ASC
    `);

    // Prerequisites are stored as ids ("1,2"); show their course codes alongside.
    const tokens = rows.map((r) => parsePrereqTokens(r.prerequisites));
    const ids = [...new Set(tokens.flat().filter(isNumericToken).map(Number))];

    let idToCode = new Map();
    if (ids.length > 0) {
      const { rows: found } = await db.query(
        'SELECT course_id, course_code FROM courses WHERE course_id = ANY($1::int[])',
        [ids]
      );
      idToCode = new Map(found.map((r) => [String(r.course_id), r.course_code]));
    }

    return rows.map((row, i) => ({
      ...row,
      prerequisite_codes: tokens[i].map((t) => idToCode.get(t) || t).join(', '),
    }));
  }

  static async getById(courseId) {
    const { rows } = await db.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    const course = rows[0];
    if (!course) return null;

    const [prerequisites, assignments] = await Promise.all([
      CourseModel.resolvePrerequisiteIds(course.prerequisites),
      CourseModel.getAssignments(courseId),
    ]);
    return { ...course, prerequisites, assignments };
  }

  /** "1,2" or a mix of ids and course codes -> array of course ids. */
  static async resolvePrerequisiteIds(value) {
    const tokens = parsePrereqTokens(value);
    const ids = tokens.filter(isNumericToken).map(Number);
    const codes = tokens.filter((t) => !isNumericToken(t));
    if (codes.length === 0) return ids;

    const { rows } = await db.query(
      'SELECT course_id FROM courses WHERE course_code = ANY($1::text[])',
      [codes]
    );
    return [...ids, ...rows.map((r) => r.course_id)];
  }

  static async getAssignments(courseId) {
    const { rows } = await db.query(`
      SELECT
        cc.curriculum_id, cc.year_level, cc.semester_id,
        cur.program_id, p.program_name, p.program_abbr,
        cur.version_name, cur.start_year, s.semester_label
      FROM curriculum_courses cc
      LEFT JOIN curricula cur ON cc.curriculum_id = cur.curriculum_id
      LEFT JOIN programs p ON cur.program_id = p.program_id
      LEFT JOIN semester s ON cc.semester_id = s.semester_id
      WHERE cc.course_id = $1
    `, [courseId]);
    return rows;
  }

  static async getByCode(courseCode) {
    const { rows } = await db.query('SELECT * FROM courses WHERE course_code = $1', [courseCode]);
    return rows[0];
  }

  // total_units used to be left NULL on every course; it is now lec + lab.
  static async create(data, client = db) {
    const { course_code, course_name, lec_units, lab_units, course_desc, is_active, prerequisites } = data;
    const { rows } = await client.query(`
      INSERT INTO courses
        (course_code, course_name, lec_units, lab_units, total_units, course_desc, is_active, prerequisites)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [course_code, course_name, lec_units, lab_units, (lec_units || 0) + (lab_units || 0),
        course_desc, is_active, toPrereqString(prerequisites)]);
    return rows[0];
  }

  static async update(courseId, data, client = db) {
    const { course_code, course_name, lec_units, lab_units, course_desc, prerequisites, grading_scheme } = data;
    const { rows } = await client.query(`
      UPDATE courses
         SET course_code = $1, course_name = $2, lec_units = $3, lab_units = $4,
             total_units = $5, course_desc = $6, prerequisites = $7, grading_scheme = $8,
             updated_at = NOW()
       WHERE course_id = $9
       RETURNING *
    `, [course_code, course_name, lec_units, lab_units, (lec_units || 0) + (lab_units || 0),
        course_desc, toPrereqString(prerequisites), grading_scheme || null, courseId]);
    return rows[0] || null;
  }

  // Soft delete: the row stays, so grades and curricula that point to it keep working.
  static async archive(courseId, client = db) {
    const { rows } = await client.query(`
      UPDATE courses SET is_archived = true, archived_at = NOW(), updated_at = NOW()
       WHERE course_id = $1 RETURNING *
    `, [courseId]);
    return rows[0] || null;
  }

  static async restore(courseId, client = db) {
    const { rows } = await client.query(`
      UPDATE courses SET is_archived = false, archived_at = NULL, updated_at = NOW()
       WHERE course_id = $1 RETURNING *
    `, [courseId]);
    return rows[0] || null;
  }

  static async addToCurriculum(curriculumId, courseId, yearLevel, semesterId, client = db) {
    const { rows } = await client.query(`
      INSERT INTO curriculum_courses (curriculum_id, course_id, year_level, semester_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (curriculum_id, course_id) DO UPDATE
        SET year_level = EXCLUDED.year_level, semester_id = EXCLUDED.semester_id, updated_at = NOW()
      RETURNING id
    `, [curriculumId, courseId, yearLevel, semesterId]);
    return rows[0];
  }

  /**
   * Make the course's curriculum assignments exactly `assignments`.
   * Removes only the ones no longer listed and upserts the rest, instead of
   * deleting everything and re-inserting, so existing rows keep their ids.
   */
  static async replaceAssignments(courseId, assignments, client = db) {
    const keep = assignments.map((a) => a.curriculum_id);
    await client.query(
      'DELETE FROM curriculum_courses WHERE course_id = $1 AND curriculum_id <> ALL($2::int[])',
      [courseId, keep]
    );
    for (const a of assignments) {
      await CourseModel.addToCurriculum(a.curriculum_id, courseId, a.year_level, a.semester_id, client);
    }
  }
}

module.exports = CourseModel;