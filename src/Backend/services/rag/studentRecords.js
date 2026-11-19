const db = require('../../config/db');
const GradeManageModel = require('../../models/grademanageModel');

const MAX_RECORDS = 40;
const SCAN_LIMIT = 2000;

const STOP = new Set([
  'who', 'what', 'which', 'list', 'show', 'give', 'the', 'and', 'for', 'are', 'is', 'in',
  'of', 'on', 'student', 'students', 'status', 'latin', 'honor', 'honors', 'qualify',
  'qualifies', 'qualified', 'probation', 'probationary', 'warning', 'about', 'tell', 'info',
  'information', 'does', 'did', 'with', 'year', 'program', 'male', 'female', 'males',
  'females', 'section', 'sections', 'how', 'many', 'all', 'any', 'there', 'per', 'by', 'each', 'total', 'number',
]);

const clean = (v) => String(v ?? '').replace(/[<>]/g, '');

function parseFilters(question) {
  let rest = question.toLowerCase();
  const f = {};
  const take = (re, fn) => {
    const m = rest.match(re);
    if (!m) return;
    fn(m);
    rest = rest.replace(re, ' ');
  };

  take(/\b(?:female|females|women|girls?)\b/, () => (f.sex = 'Female'));
  take(/\b(?:male|males|men|boys?)\b/, () => (f.sex = 'Male'));
  take(/\bsection\s+(?!per\b)([a-z0-9-]+)/, (m) => (f.sectionText = m[1]));
  take(/\byear\s*(\d)\b|\b(\d)(?:st|nd|rd|th)\s*year\b/, (m) => (f.year = String(m[1] || m[2])));
  take(/\bprobation(?:ary)?\b/, () => (f.status = 'Probationary'));
  take(/\bwarning\b/, () => (f.status = 'Warning'));

  const terms = (rest.match(/[a-z0-9-]{3,}/g) ?? []).filter((t) => !STOP.has(t));
  return { filters: f, terms };
}

async function getStudentRecords(question, programIds) {
  const { filters: f, terms } = parseFilters(question);

  const { rows: programs } = await db.query(
    `SELECT program_id, program_code, program_abbr, program_name
       FROM programs WHERE program_id = ANY($1) ORDER BY program_name`,
    [programIds]
  );
  const q = question.toLowerCase();
  const matchedPrograms = programs.filter((p) =>
    [p.program_abbr, p.program_code, p.program_name].some((n) => n && q.includes(String(n).toLowerCase()))
  );
  if (matchedPrograms.length) f.program = matchedPrograms.map((p) => p.program_id);

  const { rows: sections } = await db.query(
    `SELECT section_id, section_name FROM sections WHERE program_id = ANY($1)`,
    [programIds]
  );
  const matchedSections = sections.filter((x) => x.section_name && q.includes(x.section_name.toLowerCase()));
  if (matchedSections.length) f.sectionIds = matchedSections.map((x) => x.section_id);

  const hasFilter = Object.keys(f).length > 0;

  if (/\b(?:per|each|by|every)\s+sections?\b|\bsections\b/.test(q) && !f.sectionIds) {
    const params = [programIds];
    let programCond = '';
    if (f.program) {
      params.push(f.program);
      programCond = 'AND sec.program_id = ANY($2)';
    }
    const { rows: counts } = await db.query(
      `SELECT sec.section_name, prog.program_abbr, COUNT(s.student_id) AS students
         FROM sections sec
         LEFT JOIN programs prog ON prog.program_id = sec.program_id
         LEFT JOIN section_assignments sa ON sa.section_id = sec.section_id
         LEFT JOIN student_education se ON se.assignment_id = sa.assignment_id AND se.is_current = true
         LEFT JOIN students s ON s.student_id = se.student_id AND s.archived_at IS NULL
        WHERE sec.program_id = ANY($1) ${programCond}
        GROUP BY sec.section_id, prog.program_abbr
        ORDER BY prog.program_abbr, sec.section_name`,
      params
    );
    return `${counts.length} sections (non-archived students per section):\n${counts
      .map((r) => `${clean(r.section_name)} (${clean(r.program_abbr)}): ${r.students} students`)
      .join('\n')}`;
  }

  if (!hasFilter && /\bprograms?\b/.test(q)) {
    const { rows: counts } = await db.query(
      `SELECT p.program_name, p.program_abbr, p.program_code, COUNT(s.student_id) AS students
         FROM programs p
         LEFT JOIN curricula c ON c.program_id = p.program_id
         LEFT JOIN student_education se ON se.curriculum_id = c.curriculum_id AND se.is_current = true
         LEFT JOIN students s ON s.student_id = se.student_id AND s.archived_at IS NULL
        WHERE p.program_id = ANY($1)
        GROUP BY p.program_id
        ORDER BY p.program_name`,
      [programIds]
    );
    return `${counts.length} programs (non-archived students per program):\n${counts
      .map((r) => `${clean(r.program_name)} (${clean(r.program_abbr || r.program_code)}): ${r.students} students`)
      .join('\n')}`;
  }
  if (!hasFilter && !terms.length) return null;

  const params = [programIds];
  const conds = ['s.archived_at IS NULL', 'prog.program_id = ANY($1)'];
  const bind = (sql, value) => {
    params.push(value);
    conds.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (f.program) bind('prog.program_id = ANY(?)', f.program);
  if (f.sex) bind('p.sex::text = ?', f.sex);
  if (f.sectionIds) bind('sec.section_id = ANY(?)', f.sectionIds);
  else if (f.sectionText) bind('sec.section_name ILIKE ?', `%${f.sectionText}%`);
  if (f.year) bind('se.year_level::text = ?', f.year);
  if (!hasFilter) {
    bind(
      `(CONCAT_WS(' ', p.first_name, p.last_name) ILIKE ANY(?) OR u.username ILIKE ANY(?))`,
      terms.map((t) => `%${t}%`)
    );
  }

  const { rows } = await db.query(
    `SELECT s.student_id, u.username AS student_number,
            CONCAT_WS(' ', p.first_name, NULLIF(p.middle_name, ''), p.last_name, NULLIF(p.suffix, '')) AS full_name,
            p.sex, se.year_level, se.classification, se.enrollment_status,
            sec.section_name, prog.program_abbr
       FROM students s
       LEFT JOIN users u ON u.user_id = s.user_id
       LEFT JOIN student_pii p ON p.student_id = s.student_id
       LEFT JOIN student_education se ON se.student_id = s.student_id AND se.is_current = true
       LEFT JOIN section_assignments sa ON sa.assignment_id = se.assignment_id
       LEFT JOIN sections sec ON sec.section_id = sa.section_id
       LEFT JOIN curricula c ON c.curriculum_id = se.curriculum_id
       LEFT JOIN programs prog ON prog.program_id = c.program_id
      WHERE ${conds.join(' AND ')}
      ORDER BY p.last_name, p.first_name
      LIMIT ${SCAN_LIMIT}`,
    params
  );

  const standingMap = await GradeManageModel.getAcademicStandingMap(rows.map((r) => r.student_id));
  let matches = rows.map((r) => ({
    ...r,
    academic_status: standingMap.get(r.student_id)?.status || 'None',
  }));
  if (f.status) matches = matches.filter((r) => r.academic_status.startsWith(f.status));

  if (!matches.length) return '(No matching student records)';

  const lines = matches.slice(0, MAX_RECORDS).map((s) =>
    [
      clean(s.student_number),
      clean(s.full_name),
      clean(s.sex),
      clean(s.program_abbr),
      `Year ${clean(s.year_level)}`,
      `Section ${clean(s.section_name) || 'n/a'}`,
      clean(s.classification),
      clean(s.enrollment_status),
      `Academic status: ${s.academic_status}`,
    ].join(' | ')
  );

  const total = matches.length;
  return `${total} matching students${total > MAX_RECORDS ? ` (showing first ${MAX_RECORDS})` : ''}:\n${lines.join('\n')}`;
}

module.exports = { getStudentRecords };