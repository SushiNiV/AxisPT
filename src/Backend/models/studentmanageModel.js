'use strict';

/**
 * StudentManageModel: data access for student records.
 *
 * A student spans several tables: users (login), students (core record),
 * student_pii, student_addresses, student_highschool, student_family,
 * student_family_members, student_achievements and student_education.
 * create() and update() share one input reader (`readStudentInput`) and one
 * section writer (`saveProfileSections`), so both accept the same field names.
 *
 * Field names: the frontend has used several spellings over time
 * (first_name / firstName, place_of_birth / birth_place, ...). Each canonical
 * field lists its accepted aliases once, in the *_FIELDS tables below.
 *
 * Update semantics: a field that is not sent is left unchanged; a field sent
 * blank is cleared (except NOT NULL columns, where blank means "unchanged").
 * A group of fields (address, high school, ...) is written only if at least
 * one of its values is non-blank.
 *
 * Every multi-table write runs in withTransaction. Rule violations are thrown
 * as HttpError; database errors are left to the controller to translate.
 */

const bcrypt = require('bcrypt');
const db = require('../config/db');
const HttpError = require('../../utils/httpError');
const { withTransaction } = require('../../utils/transaction');

const BCRYPT_ROUNDS = 10;
const YEAR_LEVELS = ['1', '2', '3', '4', '5'];

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isBlank = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * First non-blank value among the aliases.
 * @returns {*} the value; null if an alias was sent but all were blank (clear it);
 *   undefined if no alias was sent at all (leave unchanged)
 */
function pick(data, ...aliases) {
  let sent = false;
  for (const alias of aliases) {
    if (!hasKey(data, alias)) continue;
    sent = true;
    if (!isBlank(data[alias])) {
      const value = data[alias];
      return typeof value === 'string' ? value.trim() : value;
    }
  }
  return sent ? null : undefined;
}

const parseDecimal = (label) => (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `${label} must be a number.`);
  return n;
};

const parseWholeNumber = (label) => (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${label} must be a whole number.`);
  return n;
};

function parseBoolean(value, label) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  throw new HttpError(400, `${label} must be true or false.`);
}

function parseYearLevel(value) {
  if (value === undefined || value === null) return null;
  const level = String(value);
  if (!YEAR_LEVELS.includes(level)) {
    throw new HttpError(400, `Year level must be one of: ${YEAR_LEVELS.join(', ')}.`);
  }
  return level;
}

/**
 * Read a table of [column, aliases, parser?, options?] into { column: value }.
 * Unsent fields are omitted; blank fields are null (dropped when `notNull`).
 */
function readFields(data, fields) {
  const out = {};
  for (const [column, aliases, parse, options] of fields) {
    const value = pick(data, ...aliases);
    if (value === undefined) continue;
    if (value === null) {
      if (!options?.notNull) out[column] = null;
      continue;
    }
    out[column] = parse ? parse(value) : value;
  }
  return out;
}

const hasContent = (values) => Object.values(values).some((v) => v !== null && v !== undefined);

// ---------------------------------------------------------------------------
// Field tables: canonical column <- accepted request keys
// ---------------------------------------------------------------------------

const PII_FIELDS = [
  ['first_name', ['first_name', 'firstName'], null, { notNull: true }],
  ['last_name', ['last_name', 'lastName'], null, { notNull: true }],
  ['middle_name', ['middle_name', 'middleName']],
  ['suffix', ['suffix']],
  ['sex', ['sex']],
  ['birth_place', ['birth_place', 'place_of_birth', 'placeOfBirth']],
  ['personal_email', ['personal_email', 'email']],
  ['mobile_no', ['mobile_no', 'phoneNumber']],
  ['landline', ['landline']],
  ['religion', ['religion']],
  ['nationality', ['nationality']],
  ['civil_status', ['civil_status', 'civilStatus']],
  ['height', ['height'], parseDecimal('Height')],
  ['weight', ['weight'], parseDecimal('Weight')],
  ['language_dialects', ['language_dialect', 'language_dialects', 'language']],
  ['visual_problems', ['visual_problems', 'visualProblems']],
];

const ADDRESS_FIELDS = {
  Present: [
    ['house_no', ['present_houseno', 'perm_house_no', 'house_no']],
    ['street', ['present_street', 'perm_street', 'street']],
    ['barangay', ['present_sbdvsn_brgy', 'perm_barangay', 'barangay']],
    ['city_municipality', ['present_city_mncplty', 'perm_city', 'city_municipality']],
    ['province', ['perm_province', 'province']],
  ],
  Provincial: [
    ['house_no', ['provincial_houseno', 'prov_house_no']],
    ['street', ['provincial_street', 'prov_street']],
    ['barangay', ['provincial_sbdvsn_brgy', 'prov_barangay']],
    ['city_municipality', ['provincial_city_mncplty', 'prov_city']],
    ['province', ['prov_province']],
  ],
};

const HIGHSCHOOL_FIELDS = [
  ['highschool_graduated', ['highschool_graduated', 'highschoolGraduated']],
  ['pubpriv_hs', ['pub_priv_hs', 'pubprivHS']],
  ['highschool_address', ['hs_school_address', 'schoolAddress']],
  ['hs_final_gwa', ['hs_final_gwa', 'hsFinalGWA'], parseDecimal('High school GWA')],
];

const FAMILY_FIELDS = [
  ['support', ['support', 'supportSource']],
  ['parents_income', ['parents_income', 'parentsIncome']],
  ['living_in', ['living_in', 'livingIn']],
  ['daily_transpo_expense', ['daily_transpo_expense', 'dailyTranspoExpense']],
  ['no_siblings', ['no_siblings', 'noSiblings'], parseWholeNumber('Number of siblings')],
  ['ordinal_position', ['ordinal_position', 'ordinalPosition']],
];

const ACHIEVEMENT_FIELDS = [
  ['awards_honors', ['awards_honors', 'awardsHonors']],
  ['hobbies_interests', ['hobbies_interests', 'hobbiesInterests']],
  ['future_career', ['future_career', 'futureCareer']],
  ['acad_extracurr', ['acad_extracurr', 'acad_clubs_extracurr', 'academicClubsExtracurr']],
];

const FAMILY_MEMBERS = [
  { relation: 'Father', prefix: 'father', isGuardian: false },
  { relation: 'Mother', prefix: 'mother', isGuardian: false },
  { relation: 'Guardian', prefix: 'guardian', isGuardian: true },
];

/** Output keys for getById: response key -> student_addresses column. */
const ADDRESS_OUTPUT_KEYS = {
  Present: {
    present_houseno: 'house_no', present_street: 'street',
    present_sbdvsn_brgy: 'barangay', present_city_mncplty: 'city_municipality',
    perm_house_no: 'house_no', perm_street: 'street', perm_barangay: 'barangay',
    perm_city: 'city_municipality', perm_province: 'province',
  },
  Provincial: {
    provincial_houseno: 'house_no', provincial_street: 'street',
    provincial_sbdvsn_brgy: 'barangay', provincial_city_mncplty: 'city_municipality',
    prov_house_no: 'house_no', prov_street: 'street', prov_barangay: 'barangay',
    prov_city: 'city_municipality', prov_province: 'province',
  },
};

/**
 * Read a request body into normalised, validated sections. Used by create and update.
 * @param {object} data
 * @returns {object}
 */
function readStudentInput(data) {
  const accountStatus = pick(data, 'account_status', 'accountStatus');

  const members = [];
  for (const { relation, prefix, isGuardian } of FAMILY_MEMBERS) {
    // A member is only written when a first name (or a full name) was sent.
    const first = pick(data, `${prefix}_firstname`, `${prefix}_name`);
    if (isBlank(first)) continue;
    members.push({
      relation,
      isGuardian,
      first_name: first,
      middle_name: pick(data, `${prefix}_middlename`) ?? null,
      last_name: pick(data, `${prefix}_lastname`) ?? null,
      suffix: pick(data, `${prefix}_suffix`) ?? null,
      occupation: pick(data, `${prefix}_occupation`) ?? null,
      contact_no: pick(data, `${prefix}_contact`, `${prefix}_contact_no`) ?? null,
      status: isGuardian ? 'Living' : data[`${prefix}_status`],
    });
  }

  return {
    studentNumber: pick(data, 'student_number', 'studentNumber'),
    schoolEmail: pick(data, 'school_email', 'email', 'personal_email'),
    accountStatus: isBlank(accountStatus) ? undefined : parseBoolean(accountStatus, 'Account status'),
    birthDate: pick(data, 'birth_date', 'birthDate'),
    pii: readFields(data, PII_FIELDS),
    addresses: {
      Present: readFields(data, ADDRESS_FIELDS.Present),
      Provincial: readFields(data, ADDRESS_FIELDS.Provincial),
    },
    highschool: readFields(data, HIGHSCHOOL_FIELDS),
    family: readFields(data, FAMILY_FIELDS),
    achievements: readFields(data, ACHIEVEMENT_FIELDS),
    members,
  };
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/**
 * Insert a row, or update only the given columns if it already exists.
 * Table and column names come from the constant tables above, never from requests.
 */
async function upsertPartial(client, table, conflictColumns, keyValues, values) {
  const valueColumns = Object.keys(values);
  const columns = [...Object.keys(keyValues), ...valueColumns];
  const params = [...Object.values(keyValues), ...valueColumns.map((c) => values[c])];
  const placeholders = params.map((_, i) => `$${i + 1}`);
  const updates = [...valueColumns.map((c) => `${c} = EXCLUDED.${c}`), 'updated_at = NOW()'];

  await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}, updated_at)
     VALUES (${placeholders.join(', ')}, NOW())
     ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updates.join(', ')}`,
    params
  );
}

const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

class StudentManageModel {
  // -------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------

  /**
   * @returns {Promise<{ year_id: number|null, current_sem: number|null }>}
   */
  static async getActiveAcademicTerm(client = db) {
    const { rows } = await client.query(
      `SELECT ay.year_id, ay.current_sem
         FROM academic_year ay
        WHERE ay.is_active = true
        LIMIT 1`
    );
    return rows[0] || { year_id: null, current_sem: null };
  }

  /**
   * Paged student list with program, year level and section.
   * @param {{ search?: string, programId?: number|null, includeArchived?: boolean,
   *           limit?: number, offset?: number }} [options]
   * @returns {Promise<object[]>}
   */
  static async getMasterlist({
    search = '', programId = null, includeArchived = false, limit = 100, offset = 0,
  } = {}) {
    const conditions = [];
    const values = [];

    if (!includeArchived) conditions.push('s.archived_at IS NULL');

    if (search) {
      values.push(`%${escapeLike(search)}%`);
      const p = `$${values.length}`;
      conditions.push(`(p.first_name ILIKE ${p} OR p.last_name ILIKE ${p} OR u.username ILIKE ${p})`);
    }

    if (programId) {
      values.push(programId);
      conditions.push(`prog.program_id = $${values.length}`);
    }

    values.push(limit, offset);
    const limitParam = `$${values.length - 1}`;
    const offsetParam = `$${values.length}`;

    const { rows } = await db.query(
      `SELECT
         s.student_id,
         u.user_id,
         u.username AS student_number,
         s.account_status,
         s.archived_at,
         s.archive_reason,
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
         prog.program_abbr,
         prog.program_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.user_id
       LEFT JOIN student_pii p ON s.student_id = p.student_id
       LEFT JOIN student_education se ON s.student_id = se.student_id AND se.is_current = true
       LEFT JOIN section_assignments sa ON se.assignment_id = sa.assignment_id
       LEFT JOIN sections sec ON sa.section_id = sec.section_id
       LEFT JOIN curricula c ON se.curriculum_id = c.curriculum_id
       LEFT JOIN programs prog ON c.program_id = prog.program_id
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY p.last_name ASC NULLS LAST
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values
    );
    return rows;
  }

  /**
   * Full student profile, flattened for the edit form.
   * @returns {Promise<object|null>}
   */
  static async getById(studentId) {
    const [main, addresses, members] = await Promise.all([
      db.query(
        `SELECT
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
           sa.section_id,
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
         WHERE s.student_id = $1`,
        [studentId]
      ),
      db.query('SELECT * FROM student_addresses WHERE student_id = $1', [studentId]),
      db.query('SELECT * FROM student_family_members WHERE student_id = $1', [studentId]),
    ]);

    if (main.rows.length === 0) return null;
    const student = main.rows[0];

    for (const address of addresses.rows) {
      const outputKeys = ADDRESS_OUTPUT_KEYS[address.address_type];
      if (!outputKeys) continue;
      for (const [key, column] of Object.entries(outputKeys)) student[key] = address[column];
    }

    for (const member of members.rows) {
      const relation = (member.relation_type || '').toLowerCase();
      if (!['father', 'mother', 'guardian'].includes(relation)) continue;

      student[`${relation}_firstname`] = member.first_name;
      student[`${relation}_middlename`] = member.middle_name;
      student[`${relation}_lastname`] = member.last_name;
      student[`${relation}_suffix`] = member.suffix;
      student[`${relation}_name`] = [member.first_name, member.middle_name, member.last_name, member.suffix]
        .filter(Boolean).join(' ');
      student[`${relation}_occupation`] = member.occupation;
      student[`${relation}_contact_no`] = member.contact_no;
      student[`${relation}_contact`] = member.contact_no;
      if (relation !== 'guardian') {
        student[`${relation}_status`] = member.is_alive ? 'Living' : 'Deceased';
      }
    }

    student.first_name = student.firstname;
    student.last_name = student.lastname;
    student.middle_name = student.middlename;

    return student;
  }

  // -------------------------------------------------------------------------
  // Create and update
  // -------------------------------------------------------------------------

  /**
   * Create a student: login account, student record, profile sections and the
   * current enrolment, in one transaction.
   *
   * The initial password is `data.password_hash` when supplied (it is hashed
   * here, so send plaintext), otherwise `axis-cpt-<lastname>`.
   *
   * @param {object} data  request body
   * @returns {Promise<{ student_id: number, user_id: number }>}
   * @throws {HttpError} 400 on invalid input; pg error 23505 on a duplicate student number
   */
  static async create(data) {
    const input = readStudentInput(data);
    if (!input.studentNumber || !input.pii.first_name || !input.pii.last_name) {
      throw new HttpError(400, 'Student number, first name, and last name are required.');
    }

    const lastNamePart = input.pii.last_name.toLowerCase().replace(/\s+/g, '');
    const initialPassword = data.password_hash || `axis-cpt-${lastNamePart}`;
    const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);
    const isActive = input.accountStatus ?? true;

    let created;
    await withTransaction(async (client) => {
      const { rows: [user] } = await client.query(
        `INSERT INTO users (username, password_hash, school_email, is_active, changed_pass)
         VALUES ($1, $2, $3, $4, false)
         RETURNING user_id`,
        [input.studentNumber, passwordHash, input.schoolEmail ?? null, isActive]
      );

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, (SELECT role_id FROM roles WHERE UPPER(role_name) = 'STUDENT' LIMIT 1))
         ON CONFLICT DO NOTHING`,
        [user.user_id]
      );

      const { rows: [student] } = await client.query(
        `INSERT INTO students (user_id, birth_date, account_status)
         VALUES ($1, $2, $3)
         RETURNING student_id`,
        [user.user_id, input.birthDate ?? null, isActive]
      );

      await this._saveProfileSections(client, student.student_id, input, { isNew: true });
      await this._createEducation(client, student.student_id, data);

      created = { student_id: student.student_id, user_id: user.user_id };
    });

    return created;
  }

  /**
   * Update a student. Fields not sent are left unchanged (see the file header).
   * @param {number} studentId
   * @param {object} data  request body
   * @returns {Promise<{ userId: number }>}
   * @throws {HttpError} 404 if the student does not exist; 400 on invalid input
   */
  static async update(studentId, data) {
    const input = readStudentInput(data);

    let userId;
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT user_id FROM students WHERE student_id = $1 FOR UPDATE',
        [studentId]
      );
      if (rows.length === 0) throw new HttpError(404, 'Student not found.');
      userId = rows[0].user_id;

      if (input.studentNumber || input.schoolEmail || input.accountStatus !== undefined) {
        await client.query(
          `UPDATE users
              SET username = COALESCE($1, username),
                  school_email = COALESCE($2, school_email),
                  is_active = COALESCE($3, is_active),
                  updated_at = NOW()
            WHERE user_id = $4`,
          [input.studentNumber ?? null, input.schoolEmail ?? null, input.accountStatus ?? null, userId]
        );
      }

      await client.query(
        `UPDATE students
            SET birth_date = COALESCE($1, birth_date),
                account_status = COALESCE($2, account_status),
                updated_at = NOW()
          WHERE student_id = $3`,
        [input.birthDate ?? null, input.accountStatus ?? null, studentId]
      );

      await this._saveProfileSections(client, studentId, input, { isNew: false });
      await this._updateEducation(client, studentId, data);
    });

    return { userId };
  }

  /**
   * Write the profile sections (PII, addresses, high school, family, members,
   * achievements). Sections with nothing to write are skipped.
   * @private
   */
  static async _saveProfileSections(client, studentId, input, { isNew }) {
    if (Object.keys(input.pii).length > 0) {
      await upsertPartial(client, 'student_pii', ['student_id'], { student_id: studentId }, input.pii);
    }

    for (const [type, values] of Object.entries(input.addresses)) {
      if (!hasContent(values)) continue;
      await upsertPartial(
        client, 'student_addresses', ['student_id', 'address_type'],
        { student_id: studentId, address_type: type }, values
      );
    }

    const groups = [
      ['student_highschool', input.highschool],
      ['student_family', input.family],
      ['student_achievements', input.achievements],
    ];
    for (const [table, values] of groups) {
      if (!hasContent(values)) continue;
      await upsertPartial(client, table, ['student_id'], { student_id: studentId }, values);
    }

    for (const member of input.members) {
      await this._replaceFamilyMember(client, studentId, member, { isNew });
    }
  }

  /**
   * Replace one family member row. When no living/deceased status is sent, the
   * previous value is kept (new students default to living).
   * @private
   */
  static async _replaceFamilyMember(client, studentId, member, { isNew }) {
    let isAlive = true;
    if (member.status === 'Living') isAlive = true;
    else if (member.status === 'Deceased') isAlive = false;
    else if (!isNew) {
      const { rows } = await client.query(
        'SELECT is_alive FROM student_family_members WHERE student_id = $1 AND relation_type = $2 LIMIT 1',
        [studentId, member.relation]
      );
      isAlive = rows[0]?.is_alive ?? true;
    }

    await client.query(
      'DELETE FROM student_family_members WHERE student_id = $1 AND relation_type = $2',
      [studentId, member.relation]
    );
    await client.query(
      `INSERT INTO student_family_members
         (student_id, relation_type, first_name, middle_name, last_name, suffix,
          occupation, contact_no, is_alive, is_guardian)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        studentId, member.relation, member.first_name, member.middle_name, member.last_name,
        member.suffix, member.occupation, member.contact_no, isAlive, member.isGuardian,
      ]
    );
  }

  // -------------------------------------------------------------------------
  // Education (curriculum, year level, section)
  // -------------------------------------------------------------------------

  /**
   * An explicit curriculum is used as is. With only a program, keep the
   * student's current curriculum when it belongs to that program; otherwise use
   * the program's newest curriculum that has courses.
   * @private
   */
  static async _resolveCurriculumId(client, curriculumId, programId, studentId) {
    if (curriculumId) return curriculumId;
    if (!programId) return null;

    const { rows } = await client.query(
      `SELECT COALESCE(
         (SELECT se.curriculum_id
            FROM student_education se
            JOIN curricula c ON c.curriculum_id = se.curriculum_id
           WHERE se.student_id = $2 AND se.is_current = true AND c.program_id = $1
           LIMIT 1),
         (SELECT c.curriculum_id
            FROM curricula c
           WHERE c.program_id = $1
           ORDER BY EXISTS (
             SELECT 1 FROM curriculum_courses cc WHERE cc.curriculum_id = c.curriculum_id
           ) DESC, c.curriculum_id DESC
           LIMIT 1)
       ) AS curriculum_id`,
      [programId, studentId]
    );
    return rows[0]?.curriculum_id || null;
  }

  /** @private */
  static async _findAssignmentForSection(client, sectionId, yearId, semesterId) {
    const { rows } = await client.query(
      `SELECT assignment_id, year_id, semester_id
         FROM section_assignments
        WHERE section_id = $1 AND year_id = $2 AND semester_id = $3
        LIMIT 1`,
      [sectionId, yearId, semesterId]
    );
    return rows[0] || null;
  }

  /**
   * A section assignment must be for the same year level as the student.
   * @private
   * @throws {HttpError} 400 on mismatch
   */
  static async _assertSectionMatchesYearLevel(client, assignmentId, yearLevel) {
    if (!assignmentId || !yearLevel) return;
    const { rows } = await client.query(
      'SELECT year_level::text AS yl FROM section_assignments WHERE assignment_id = $1',
      [assignmentId]
    );
    const section = rows[0];
    if (section && String(section.yl) !== String(yearLevel)) {
      throw new HttpError(
        400,
        `Section year level (${section.yl}) does not match student year level (${yearLevel}).`
      );
    }
  }

  /** Insert the student's first (current) enrolment record. @private */
  static async _createEducation(client, studentId, data) {
    const term = await this.getActiveAcademicTerm(client);
    const curriculumId = await this._resolveCurriculumId(
      client, data.curriculum_id, data.program_id, studentId
    );
    const yearLevel = parseYearLevel(pick(data, 'year_level', 'yearLevel')) || '1';
    const yearId = data.year_id || term.year_id;
    const semesterId = data.semester_id || term.current_sem;

    let assignmentId = data.assignment_id || null;
    if (!assignmentId && data.section_id) {
      const assignment = await this._findAssignmentForSection(client, data.section_id, yearId, semesterId);
      assignmentId = assignment?.assignment_id || null;
    }
    await this._assertSectionMatchesYearLevel(client, assignmentId, yearLevel);

    await client.query(
      `INSERT INTO student_education
         (student_id, curriculum_id, assignment_id, year_id, semester_id, year_level,
          classification, enrollment_status, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [
        studentId, curriculumId, assignmentId, yearId, semesterId, yearLevel,
        data.classification || 'New', data.enrollment_status || 'Enrolled',
      ]
    );
  }

  /**
   * Update the current enrolment. Sending `section_id` or `assignment_id` blank
   * clears the student's section. Without a current row, the most recent one is
   * revived.
   * @private
   */
  static async _updateEducation(client, studentId, data) {
    const yearLevel = parseYearLevel(pick(data, 'year_level', 'yearLevel'));
    const classification = pick(data, 'classification') ?? null;
    const curriculumId = await this._resolveCurriculumId(
      client, data.curriculum_id, data.program_id, studentId
    );

    const sectionWasSent = hasKey(data, 'section_id') || hasKey(data, 'assignment_id');
    let assignmentId = null;
    let sectionYearId = null;
    let sectionSemesterId = null;

    if (sectionWasSent) {
      if (data.assignment_id) {
        assignmentId = Number(data.assignment_id);
        if (!Number.isInteger(assignmentId) || assignmentId < 1) {
          throw new HttpError(400, 'Invalid assignment id.');
        }
        const { rows } = await client.query(
          'SELECT year_id, semester_id FROM section_assignments WHERE assignment_id = $1',
          [assignmentId]
        );
        sectionYearId = rows[0]?.year_id ?? null;
        sectionSemesterId = rows[0]?.semester_id ?? null;
      } else if (data.section_id) {
        const term = await this.getActiveAcademicTerm(client);
        const assignment = await this._findAssignmentForSection(
          client, data.section_id, data.year_id || term.year_id, data.semester_id || term.current_sem
        );
        if (assignment) {
          assignmentId = assignment.assignment_id;
          sectionYearId = assignment.year_id;
          sectionSemesterId = assignment.semester_id;
        }
      }
      // If neither resolved, assignmentId stays null and the section is cleared.
    }

    const effectiveYearLevel = yearLevel || (await client.query(
      `SELECT year_level::text AS yl FROM student_education
        WHERE student_id = $1 AND is_current = true LIMIT 1`,
      [studentId]
    )).rows[0]?.yl || null;
    await this._assertSectionMatchesYearLevel(client, assignmentId, effectiveYearLevel);

    if (!(curriculumId || yearLevel || classification || sectionWasSent)) return;

    const assignments = `
      curriculum_id = COALESCE($1, curriculum_id),
      year_level = COALESCE($2, year_level),
      classification = COALESCE($3, classification),
      year_id = COALESCE($4, year_id),
      semester_id = COALESCE($5, semester_id),
      assignment_id = CASE WHEN $6 THEN $7 ELSE assignment_id END,
      updated_at = NOW()`;
    const values = [
      curriculumId, yearLevel, classification, sectionYearId, sectionSemesterId,
      sectionWasSent, assignmentId, studentId,
    ];

    const updated = await client.query(
      `UPDATE student_education SET ${assignments}
        WHERE student_id = $8 AND is_current = true
        RETURNING education_id`,
      values
    );
    if (updated.rowCount > 0) return;

    // No current row: revive the most recent one (legacy archived students).
    const revived = await client.query(
      `UPDATE student_education SET ${assignments}, is_current = true
        WHERE education_id = (
          SELECT education_id FROM student_education
           WHERE student_id = $8
           ORDER BY education_id DESC
           LIMIT 1
        )
        RETURNING education_id`,
      values
    );
    if (revived.rowCount === 0) {
      throw new HttpError(400, 'No enrollment row found for this student.');
    }
  }

  /**
   * Move many students to a year level and/or section in one statement.
   * The section is looked up in the active academic term.
   *
   * @param {number[]} studentIds
   * @param {{ yearLevel?: string|null, sectionId?: number|null }} changes
   * @returns {Promise<number[]>} ids of the students that were updated
   * @throws {HttpError} 400 if the section is not assigned in the active term or
   *   its year level differs from the requested one
   */
  static async bulkUpdateEducation(studentIds, { yearLevel = null, sectionId = null } = {}) {
    let assignmentId = null;

    if (sectionId) {
      const term = await this.getActiveAcademicTerm(db);
      const { rows } = await db.query(
        `SELECT assignment_id, year_level::text AS yl
           FROM section_assignments
          WHERE section_id = $1 AND year_id = $2 AND semester_id = $3
          LIMIT 1`,
        [sectionId, term.year_id, term.current_sem]
      );
      if (rows.length === 0) {
        throw new HttpError(400, 'That section has no assignment in the active academic term.');
      }
      if (yearLevel && String(rows[0].yl) !== String(yearLevel)) {
        throw new HttpError(
          400,
          `Section year level (${rows[0].yl}) does not match the requested year level (${yearLevel}).`
        );
      }
      assignmentId = rows[0].assignment_id;
    }

    const { rows } = await db.query(
      `UPDATE student_education
          SET year_level = COALESCE($1, year_level),
              assignment_id = COALESCE($2, assignment_id),
              updated_at = NOW()
        WHERE student_id = ANY($3::int[]) AND is_current = true
        RETURNING student_id`,
      [yearLevel ? String(yearLevel) : null, assignmentId, studentIds]
    );
    return rows.map((r) => r.student_id);
  }

  // -------------------------------------------------------------------------
  // Status, archive, delete
  // -------------------------------------------------------------------------

  /**
   * Set a manual probation status (for the active term) and/or the standing.
   * `probationStatus` "Automatic" removes the manual override.
   *
   * @param {number} studentId
   * @param {{ probationStatus?: string, standing?: string, facultyId?: number|null }} changes
   * @returns {Promise<{ studentUserId: number, before: object, after: object }>}
   * @throws {HttpError} 404 if the student does not exist; 400 if there is no active term
   */
  static async updateStatus(studentId, { probationStatus, standing, facultyId = null }) {
    let result;

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT user_id, standing FROM students WHERE student_id = $1 FOR UPDATE',
        [studentId]
      );
      if (rows.length === 0) throw new HttpError(404, 'Student not found.');
      const { user_id: studentUserId, standing: currentStanding } = rows[0];

      const term = await this.getActiveAcademicTerm(client);
      const termKnown = term.year_id != null && term.current_sem != null;

      // Current manual probation override for this term, if any.
      let currentProbation = 'Automatic';
      if (termKnown) {
        const { rows: statusRows } = await client.query(
          `SELECT probation_status, verified_by_id FROM student_status
            WHERE student_id = $1 AND year_id = $2 AND semester_id = $3`,
          [studentId, term.year_id, term.current_sem]
        );
        const row = statusRows[0];
        if (row && row.verified_by_id != null) currentProbation = row.probation_status || 'None';
      }

      let newProbation = currentProbation;
      if (probationStatus !== undefined) {
        if (!termKnown) throw new HttpError(400, 'There is no active academic term.');

        if (probationStatus === 'Automatic') {
          // Keep the row (it may hold residency data); just drop the override.
          await client.query(
            `UPDATE student_status
                SET probation_status = NULL, verified_by_id = NULL,
                    verification_date = NULL, updated_at = NOW()
              WHERE student_id = $1 AND year_id = $2 AND semester_id = $3`,
            [studentId, term.year_id, term.current_sem]
          );
        } else {
          await client.query(
            `INSERT INTO student_status
               (student_id, year_id, semester_id, probation_status, verified_by_id, verification_date)
             VALUES ($1, $2, $3, $4::probation_status_type, $5, CURRENT_DATE)
             ON CONFLICT (student_id, year_id, semester_id) DO UPDATE SET
               probation_status  = EXCLUDED.probation_status,
               verified_by_id    = EXCLUDED.verified_by_id,
               verification_date = EXCLUDED.verification_date,
               updated_at        = NOW()`,
            [studentId, term.year_id, term.current_sem, probationStatus, facultyId]
          );
        }
        newProbation = probationStatus;
      }

      let newStanding = currentStanding;
      if (standing !== undefined) {
        await client.query(
          'UPDATE students SET standing = $1::standing_type, updated_at = NOW() WHERE student_id = $2',
          [standing, studentId]
        );
        newStanding = standing;
      }

      result = {
        studentUserId,
        before: { probation: currentProbation, standing: currentStanding },
        after: { probation: newProbation, standing: newStanding },
      };
    });

    return result;
  }

  /**
   * Archive a student and deactivate their login. The enrolment row is left
   * current so the archived list can still show program, year level and section.
   * @param {number} studentId
   * @param {{ reason?: string|null }} [options]
   * @returns {Promise<{ userId: number|null }>}
   * @throws {HttpError} 404 if not found, 400 if already archived
   */
  static async archive(studentId, { reason = null } = {}) {
    let userId;

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT user_id, archived_at FROM students WHERE student_id = $1 FOR UPDATE',
        [studentId]
      );
      if (rows.length === 0) throw new HttpError(404, 'Student not found.');
      if (rows[0].archived_at) throw new HttpError(400, 'Student is already archived.');
      userId = rows[0].user_id;

      await client.query(
        `UPDATE students
            SET archived_at = NOW(), archive_reason = $1, updated_at = NOW()
          WHERE student_id = $2`,
        [reason || null, studentId]
      );

      if (userId) {
        await client.query(
          'UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = $1',
          [userId]
        );
      }
    });

    return { userId };
  }

  /**
   * Restore an archived student and reactivate their login.
   * @param {number} studentId
   * @returns {Promise<{ userId: number|null }>}
   * @throws {HttpError} 404 if not found, 400 if not archived
   */
  static async unarchive(studentId) {
    let userId;

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT user_id, archived_at FROM students WHERE student_id = $1 FOR UPDATE',
        [studentId]
      );
      if (rows.length === 0) throw new HttpError(404, 'Student not found.');
      if (!rows[0].archived_at) throw new HttpError(400, 'Student is not archived.');
      userId = rows[0].user_id;

      await client.query(
        `UPDATE students
            SET archived_at = NULL, archive_reason = NULL, updated_at = NOW()
          WHERE student_id = $1`,
        [studentId]
      );

      if (userId) {
        await client.query(
          'UPDATE users SET is_active = true, updated_at = NOW() WHERE user_id = $1',
          [userId]
        );
      }
    });

    return { userId };
  }

  /**
   * Permanently delete a student and everything attached to them.
   *
   * @deprecated Nothing in the cleaned controllers calls this (students are
   * archived, not deleted). It does not remove rows other tables hold for the
   * user (avatars, notifications, history), so it can fail on a foreign key.
   * Remove it once a project-wide search shows no callers.
   *
   * @returns {Promise<boolean>} false if the student did not exist
   */
  static async delete(studentId) {
    let deleted = false;

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT user_id FROM students WHERE student_id = $1',
        [studentId]
      );
      if (rows.length === 0) return;
      const userId = rows[0].user_id;

      // Children first.
      await client.query(
        'DELETE FROM grade_components WHERE grade_id IN (SELECT grade_id FROM grades WHERE student_id = $1)',
        [studentId]
      );
      for (const table of [
        'grades', 'student_status', 'student_achievements', 'student_family_members',
        'student_family', 'student_highschool', 'student_addresses', 'student_education',
        'student_pii', 'students',
      ]) {
        await client.query(`DELETE FROM ${table} WHERE student_id = $1`, [studentId]);
      }

      if (userId) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
      }
      deleted = true;
    });

    return deleted;
  }
}

module.exports = StudentManageModel;