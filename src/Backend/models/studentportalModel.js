'use strict';

/**
 * StudentPortalModel: data access for the signed-in student's own pages
 * (grades, current subjects, profile). Every method takes the student's id,
 * which the controller reads from the verified token, never from the request.
 */

const db = require('../config/db');
const { withTransaction } = require('../../utils/transaction');

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

/** Trim strings; blank and missing values become null. */
const clean = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
  return value;
};

/** Parse a number; blank or non-numeric values become null. */
const num = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
};

/** Whether the request body contains any of these keys (even if blank). */
const makeHas = (body) => (...keys) => keys.some((k) => Object.prototype.hasOwnProperty.call(body, k));

/** First non-blank value among these keys, or null. */
const makeFirst = (body) => (...keys) => {
  for (const key of keys) {
    const value = clean(body[key]);
    if (value !== null) return value;
  }
  return null;
};

/** Profile field -> [student_pii column, parser]. NOT NULL columns are listed in PII_NOT_NULL. */
const PII_FIELDS = {
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
const PII_NOT_NULL = ['first_name', 'last_name'];

class StudentPortalModel {
  // -------------------------------------------------------------------------
  // Grades and subjects
  // -------------------------------------------------------------------------

  /**
   * The student's grades with their score components. Archived grades are
   * hidden: they are corrections staff have set aside.
   * @param {number} studentId
   * @returns {Promise<object[]>}
   */
  static async getGrades(studentId) {
    const { rows: grades } = await db.query(
      `SELECT
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
       WHERE g.student_id = $1 AND g.archived_at IS NULL
       ORDER BY g.year_id DESC, g.semester_id DESC, c.course_code`,
      [studentId]
    );
    if (grades.length === 0) return [];

    const { rows: components } = await db.query(
      `SELECT grade_id, term, component_name, score, percentage
         FROM grade_components
        WHERE grade_id = ANY($1::int[])
        ORDER BY grade_id, term, component_name`,
      [grades.map((g) => g.grade_id)]
    );

    const byGrade = new Map();
    for (const component of components) {
      if (!byGrade.has(component.grade_id)) byGrade.set(component.grade_id, []);
      byGrade.get(component.grade_id).push(component);
    }

    return grades.map((grade) => ({ ...grade, components: byGrade.get(grade.grade_id) || [] }));
  }

  /**
   * The courses of the student's current term, from their curriculum.
   * @param {number} studentId
   * @returns {Promise<{ education: object|null, enrolled: object[] }>}
   */
  static async getCurrentSubjects(studentId) {
    const { rows } = await db.query(
      `SELECT curriculum_id, year_level, semester_id, year_id
         FROM student_education
        WHERE student_id = $1 AND is_current = true
        LIMIT 1`,
      [studentId]
    );
    if (rows.length === 0) return { education: null, enrolled: [] };

    const education = rows[0];
    const { rows: enrolled } = await db.query(
      `SELECT
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
       ORDER BY c.course_code`,
      [studentId, education.curriculum_id, education.year_level, education.semester_id]
    );

    return { education, enrolled };
  }

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------

  /**
   * The student's profile, flattened for the profile form.
   * @param {number} studentId
   * @returns {Promise<object|null>}
   */
  static async getProfile(studentId) {
    const [main, addresses, members] = await Promise.all([
      db.query(
        `SELECT
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
         WHERE s.student_id = $1`,
        [studentId]
      ),
      db.query('SELECT * FROM student_addresses WHERE student_id = $1', [studentId]),
      db.query('SELECT * FROM student_family_members WHERE student_id = $1', [studentId]),
    ]);

    if (main.rows.length === 0) return null;
    const profile = main.rows[0];

    for (const address of addresses.rows) {
      const prefix = { Present: 'perm', Provincial: 'prov' }[address.address_type];
      if (!prefix) continue;
      profile[`${prefix}_house_no`] = address.house_no;
      profile[`${prefix}_street`] = address.street;
      profile[`${prefix}_barangay`] = address.barangay;
      profile[`${prefix}_city`] = address.city_municipality;
      profile[`${prefix}_province`] = address.province;
    }

    for (const member of members.rows) {
      const relation = (member.relation_type || '').toLowerCase();
      if (!['father', 'mother', 'guardian'].includes(relation)) continue;
      profile[`${relation}_firstname`] = member.first_name;
      profile[`${relation}_middlename`] = member.middle_name;
      profile[`${relation}_lastname`] = member.last_name;
      profile[`${relation}_suffix`] = member.suffix;
      profile[`${relation}_occupation`] = member.occupation;
      profile[`${relation}_contact`] = member.contact_no;
      if (relation !== 'guardian') {
        profile[`${relation}_status`] = member.is_alive ? 'Living' : 'Deceased';
      }
    }

    return profile;
  }

  /**
   * Update the student's own profile in one transaction. Only the sections whose
   * fields appear in `body` are touched. Several spellings of each field are
   * accepted (see the `first(...)` calls).
   *
   * @param {number} studentId
   * @param {object} body  request body
   */
  static async updateProfile(studentId, body) {
    const has = makeHas(body);
    const first = makeFirst(body);

    await withTransaction(async (client) => {
      await this._updateAccount(client, studentId, body, has);
      await this._updatePii(client, studentId, body, has);
      await this._saveAddresses(client, studentId, has, first);
      await this._saveHighschool(client, studentId, body, has, first);
      await this._saveFamilyMembers(client, studentId, body, has, first);
      await this._saveFamilyBackground(client, studentId, body, has);
      await this._saveAchievements(client, studentId, body, has);
    });
  }

  /** Birth date (students) and student number (users.username). @private */
  static async _updateAccount(client, studentId, body, has) {
    if (has('birth_date')) {
      await client.query(
        'UPDATE students SET birth_date = $1, updated_at = NOW() WHERE student_id = $2',
        [clean(body.birth_date), studentId]
      );
    }
    if (has('student_number')) {
      await client.query(
        `UPDATE users SET username = $1, updated_at = NOW()
          WHERE user_id = (SELECT user_id FROM students WHERE student_id = $2)`,
        [clean(body.student_number), studentId]
      );
    }
  }

  /** @private */
  static async _updatePii(client, studentId, body, has) {
    const sets = [];
    const values = [];

    for (const [key, [column, parse]] of Object.entries(PII_FIELDS)) {
      if (!has(key)) continue;
      let value = parse(body[key]);
      // NOT NULL columns: store an empty string rather than violating the constraint.
      if (value === null && PII_NOT_NULL.includes(key)) value = '';
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
    if (sets.length === 0) return;

    values.push(studentId);
    await client.query(
      `UPDATE student_pii SET ${sets.join(', ')}, updated_at = NOW() WHERE student_id = $${values.length}`,
      values
    );
  }

  /** Insert or update an address; delete it when every part is blank. @private */
  static async _saveAddresses(client, studentId, has, first) {
    const save = async (type, keys, address) => {
      if (!has(...keys)) return;

      if (Object.values(address).some((v) => v !== null)) {
        await client.query(
          `INSERT INTO student_addresses
             (student_id, address_type, house_no, street, barangay, city_municipality, province, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (student_id, address_type) DO UPDATE SET
             house_no = EXCLUDED.house_no, street = EXCLUDED.street, barangay = EXCLUDED.barangay,
             city_municipality = EXCLUDED.city_municipality, province = EXCLUDED.province, updated_at = NOW()`,
          [studentId, type, address.house, address.street, address.barangay, address.city, address.province]
        );
      } else {
        await client.query(
          'DELETE FROM student_addresses WHERE student_id = $1 AND address_type = $2',
          [studentId, type]
        );
      }
    };

    await save(
      'Present',
      ['present_houseno', 'perm_house_no', 'present_street', 'perm_street', 'present_barangay',
        'perm_barangay', 'present_city', 'perm_city', 'perm_province', 'present_province'],
      {
        house: first('present_houseno', 'perm_house_no'),
        street: first('present_street', 'perm_street'),
        barangay: first('present_barangay', 'present_sbdvsn_brgy', 'perm_barangay'),
        city: first('present_city', 'present_city_mncplty', 'perm_city'),
        province: first('present_province', 'perm_province'),
      }
    );

    await save(
      'Provincial',
      ['provincial_houseno', 'prov_house_no', 'provincial_street', 'prov_street', 'provincial_barangay',
        'prov_barangay', 'provincial_city', 'prov_city', 'provincial_province', 'prov_province'],
      {
        house: first('provincial_houseno', 'prov_house_no'),
        street: first('provincial_street', 'prov_street'),
        barangay: first('provincial_barangay', 'provincial_sbdvsn_brgy', 'prov_barangay'),
        city: first('provincial_city', 'provincial_city_mncplty', 'prov_city'),
        province: first('provincial_province', 'prov_province'),
      }
    );
  }

  /** @private */
  static async _saveHighschool(client, studentId, body, has, first) {
    if (!has('highschool_graduated', 'pub_priv_hs', 'hs_school_address', 'hs_final_gwa')) return;

    await client.query(
      `INSERT INTO student_highschool
         (student_id, highschool_graduated, pubpriv_hs, highschool_address, hs_final_gwa, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (student_id) DO UPDATE SET
         highschool_graduated = EXCLUDED.highschool_graduated, pubpriv_hs = EXCLUDED.pubpriv_hs,
         highschool_address = EXCLUDED.highschool_address, hs_final_gwa = EXCLUDED.hs_final_gwa,
         updated_at = NOW()`,
      [
        studentId,
        clean(body.highschool_graduated),
        first('pub_priv_hs', 'pubpriv_hs'),
        first('hs_school_address', 'highschool_address'),
        num(body.hs_final_gwa),
      ]
    );
  }

  /** Father, mother and guardian. A living/deceased status that is not sent is kept. @private */
  static async _saveFamilyMembers(client, studentId, body, has, first) {
    const save = async (relation, prefix, isGuardian) => {
      if (!has(`${prefix}_firstname`, `${prefix}_lastname`, `${prefix}_occupation`, `${prefix}_contact`)) return;

      const member = {
        first: clean(body[`${prefix}_firstname`]),
        middle: clean(body[`${prefix}_middlename`]),
        last: clean(body[`${prefix}_lastname`]),
        suffix: clean(body[`${prefix}_suffix`]),
        occupation: clean(body[`${prefix}_occupation`]),
        contact: first(`${prefix}_contact`, `${prefix}_contact_no`),
      };

      const { rows } = await client.query(
        'SELECT is_alive FROM student_family_members WHERE student_id = $1 AND relation_type = $2 LIMIT 1',
        [studentId, relation]
      );
      await client.query(
        'DELETE FROM student_family_members WHERE student_id = $1 AND relation_type = $2',
        [studentId, relation]
      );
      if (!Object.values(member).some((v) => v !== null)) return;

      const status = body[`${prefix}_status`];
      let isAlive = rows[0]?.is_alive ?? true;
      if (isGuardian || status === 'Living') isAlive = true;
      else if (status === 'Deceased') isAlive = false;

      await client.query(
        `INSERT INTO student_family_members
           (student_id, relation_type, first_name, middle_name, last_name, suffix,
            occupation, contact_no, is_alive, is_guardian)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          studentId, relation, member.first, member.middle, member.last, member.suffix,
          member.occupation, member.contact, isAlive, isGuardian,
        ]
      );
    };

    await save('Father', 'father', false);
    await save('Mother', 'mother', false);
    await save('Guardian', 'guardian', true);
  }

  /** @private */
  static async _saveFamilyBackground(client, studentId, body, has) {
    if (!has('support', 'parents_income', 'living_in', 'daily_transpo_expense', 'no_siblings', 'ordinal_position')) {
      return;
    }

    const siblings = clean(body.no_siblings);
    await client.query(
      `INSERT INTO student_family
         (student_id, support, parents_income, living_in, daily_transpo_expense, no_siblings, ordinal_position, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (student_id) DO UPDATE SET
         support = EXCLUDED.support, parents_income = EXCLUDED.parents_income, living_in = EXCLUDED.living_in,
         daily_transpo_expense = EXCLUDED.daily_transpo_expense, no_siblings = EXCLUDED.no_siblings,
         ordinal_position = EXCLUDED.ordinal_position, updated_at = NOW()`,
      [
        studentId,
        clean(body.support),
        clean(body.parents_income),
        clean(body.living_in),
        clean(body.daily_transpo_expense),
        siblings === null ? null : parseInt(siblings, 10),
        clean(body.ordinal_position),
      ]
    );
  }

  /** @private */
  static async _saveAchievements(client, studentId, body, has) {
    if (!has('awards_honors', 'hobbies_interests', 'future_career', 'acad_extracurr')) return;

    await client.query(
      `INSERT INTO student_achievements
         (student_id, awards_honors, hobbies_interests, future_career, acad_extracurr, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (student_id) DO UPDATE SET
         awards_honors = EXCLUDED.awards_honors, hobbies_interests = EXCLUDED.hobbies_interests,
         future_career = EXCLUDED.future_career, acad_extracurr = EXCLUDED.acad_extracurr, updated_at = NOW()`,
      [
        studentId,
        clean(body.awards_honors),
        clean(body.hobbies_interests),
        clean(body.future_career),
        clean(body.acad_extracurr),
      ]
    );
  }
}

module.exports = StudentPortalModel;