/**
 * Dashboard AI summary service.
 *
 * Code computes every number; Gemini only narrates them. No names or student
 * numbers are ever sent to the model. Results are cached per scope in
 * `ai_summary_cache` and regenerated only when the underlying data changes.
 */
const crypto = require('crypto');
const db = require('../../config/db');
const { generate } = require('../geminiProvider');
const DashboardModel = require('../../models/dashboardModel');

const MIN_REGEN_MS = 30 * 60 * 1000; // data changed: regenerate at most every 30 min
const FORCE_COOLDOWN_MS = 60 * 1000; // manual refresh: at most once a minute
const inflight = new Map();

const PROMPT_VERSION = 'v3'; // bump to force all cached summaries to regenerate

const SYSTEM_PROMPT = `You write a short academic-monitoring summary for a college portal dashboard.
Use ONLY the JSON provided. Never invent, estimate or recompute figures; quote numbers exactly.
Write for faculty in plain words. Never use codes or abbreviations such as P, F, INC or NFE.
Output exactly this markdown and nothing else:
3 or 4 highlight bullets, each on one line in the form "- [tone] sentence"
  - tone is one of: good (healthy or positive), warn (needs attention), info (neutral context)
  - max 18 words per sentence
  - wrap the key number or phrase in **double asterisks**
  - do not repeat headline totals (students, programs, courses, sections); the dashboard already shows them
a line containing only: PRIORITIES:
up to 3 short action items numbered "1.", "2.", "3." (max 8 words each, e.g. "Review students on probation")
Priorities must follow from the data and stay general; never name or single out individual students.
If the data is too small to say anything meaningful, give one "- [info]" bullet saying so and omit the priorities.`;

/** Human-readable names for grade remark codes. Unknown codes fall into "other". */
const REMARK_WORDS = { P: 'passed', F: 'failed', INC: 'incomplete', NFE: 'noFinalExam' };

/**
 * Normalizes grade remarks into { CODE: count }. Accepts an array of
 * { remark|remarks|remarks_type|code|type, count|total } rows or a plain object.
 */
function normalizeRemarks(raw) {
  const out = {};
  const add = (code, n) => {
    const k = String(code ?? '').toUpperCase().trim();
    if (k) out[k] = (out[k] || 0) + (Number(n) || 0);
  };
  if (Array.isArray(raw)) {
    raw.forEach((r) => add(r.remark ?? r.remarks ?? r.remarks_type ?? r.code ?? r.type, r.count ?? r.total));
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, v]) => add(k, v));
  }
  return out;
}

/** Replaces remark codes with words so the model never sees (or repeats) raw codes. */
function remarksToWords(raw) {
  const words = {};
  Object.entries(normalizeRemarks(raw)).forEach(([code, n]) => {
    const key = REMARK_WORDS[code] || 'other';
    words[key] = (words[key] || 0) + n;
  });
  return words;
}

/** Builds the model input. Every figure here is computed in code. */
function buildPayload(stats, scope) {
  const { totals, studentsByYear, studentsByProgram, standingCounts, topCourses, gradeRemarks } = stats;
  const n = totals.active_students;
  const c = (s) => standingCounts.find((x) => x.status === s)?.count || 0;
  const atRisk = c('Warning') + c('Probationary 1') + c('Probationary 2');
  return {
    scope: scope.key === 'admin' ? 'institution-wide' : 'single program',
    totals: {
      activeStudents: n,
      activePrograms: totals.active_programs,
      activeCourses: totals.active_courses,
      sections: totals.total_sections,
      activeFaculty: totals.active_faculty,
    },
    studentsByYear,
    studentsByProgram,
    standing: {
      none: c('None'),
      warning: c('Warning'),
      probationary1: c('Probationary 1'),
      probationary2: c('Probationary 2'),
      atRisk,
      atRiskPercent: n ? Math.round((atRisk / n) * 1000) / 10 : 0,
    },
    topCoursesByEnrollment: topCourses,
    gradeRemarks: remarksToWords(gradeRemarks),
  };
}

/**
 * Key figures shown as chips above the summary. Computed from live stats,
 * so they stay accurate even when the narrative is served from cache.
 * @returns {{label: string, tone: 'good'|'warn'|'danger'|'info'}[]}
 */
function buildChips(payload) {
  const { standing, gradeRemarks } = payload;
  const chips = [];
  if (standing.atRisk > 0) chips.push({ label: `${standing.atRisk} at risk · ${standing.atRiskPercent}%`, tone: 'warn' });
  if (gradeRemarks.incomplete > 0) chips.push({ label: `${gradeRemarks.incomplete} incomplete`, tone: 'warn' });
  if (gradeRemarks.failed > 0) chips.push({ label: `${gradeRemarks.failed} failed`, tone: 'danger' });
  if (chips.length === 0) chips.push({ label: 'No students at risk', tone: 'good' });
  return chips;
}

/** Strips code fences the model sometimes wraps around markdown output. */
const cleanModelText = (text) => text.replace(/^```(?:markdown|md)?\s*/i, '').replace(/```\s*$/, '').trim();

async function run(scope, force) {
  const key = scope.key;
  const stats = await DashboardModel.getStats(scope);
  if (stats.totals.active_students === 0) return { summary: null, empty: true, chips: [] };

  const payload = buildPayload(stats, scope);
  const chips = buildChips(payload);
  const hash = crypto.createHash('sha256').update(PROMPT_VERSION + JSON.stringify(payload)).digest('hex');

  const { rows } = await db.query(
    `SELECT summary, data_hash,
            (EXTRACT(EPOCH FROM (now() - generated_at)) * 1000)::bigint AS age_ms
     FROM ai_summary_cache WHERE scope_key = $1`,
    [key]
  );
  const cached = rows[0];
  const fromCache = (extra = {}) => ({
    summary: cached.summary, ageMs: Number(cached.age_ms), cached: true, chips, ...extra,
  });

  // Same numbers and prompt version -> no model call.
  if (cached && cached.data_hash === hash) return fromCache();

  // Numbers changed, but regenerated recently -> serve existing, flagged stale.
  if (cached && Number(cached.age_ms) < (force ? FORCE_COOLDOWN_MS : MIN_REGEN_MS)) {
    return fromCache({ stale: true });
  }

  try {
    const text = cleanModelText((await generate({ system: SYSTEM_PROMPT, prompt: JSON.stringify(payload) })) || '');
    if (!text) throw new Error('Empty model response');

    await db.query(
      `INSERT INTO ai_summary_cache (scope_key, summary, data_hash, model, generated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (scope_key) DO UPDATE
         SET summary = EXCLUDED.summary, data_hash = EXCLUDED.data_hash,
             model = EXCLUDED.model, generated_at = now()`,
      [key, text, hash, process.env.GEMINI_MODEL || null]
    );
    return { summary: text, ageMs: 0, cached: false, chips };
  } catch (err) {
    console.error('Summary generation failed:', err.message);
    if (cached) return fromCache({ stale: true });
    return { summary: null, unavailable: true, chips };
  }
}

/** Dedupes concurrent requests for the same scope into one generation. */
function getSummary(scope, { force = false } = {}) {
  if (inflight.has(scope.key)) return inflight.get(scope.key);
  const p = run(scope, force).finally(() => inflight.delete(scope.key));
  inflight.set(scope.key, p);
  return p;
}

module.exports = { getSummary };