const db = require('../config/db');
const { answerQuestion } = require('../services/rag/answerService');
const { resolveScope } = require('../services/insights/scope');

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_TEXT = 800;

const rolesOf = (user) => [].concat(user?.role ?? []).map((r) => String(r).toLowerCase());

async function getAllProgramIds() {
  const res = await db.query('SELECT program_id FROM programs');
  return res.rows.map((r) => r.program_id);
}

/**
 * Client-held chat history is untrusted: keep only the last few turns, valid
 * roles and bounded text, and strip angle brackets so a turn cannot close the
 * <conversation> block in the prompt.
 */
function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => ({
      role: t?.role === 'assistant' ? 'assistant' : t?.role === 'user' ? 'user' : null,
      text: typeof t?.text === 'string'
        ? t.text.replace(/[<>]/g, '').trim().slice(0, MAX_HISTORY_TEXT)
        : '',
    }))
    .filter((t) => t.role && t.text);
}

/**
 * Shared by the admin/faculty route and the student route. The audience is
 * decided here from the VERIFIED token, never from the route or the request body:
 *  - staff   : admin/superadmin/faculty with a valid scope -> live stats + summary
 *  - student : handbook only, no statistics or records of any kind
 *  - anyone else -> 403 (fail closed)
 */
exports.ask = async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
      return res.status(400).json({ success: false, message: 'A question is required.' });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({ success: false, message: `Questions are limited to ${MAX_QUESTION_LENGTH} characters.` });
    }

    const history = cleanHistory(req.body?.history);
    const scope = await resolveScope(req.user);

    let options;
    if (scope) {
      const programIds = scope.programId !== null ? [scope.programId] : await getAllProgramIds();
      options = {
        audience: 'staff',
        programIds,
        isAdmin: scope.programId === null,
        scope,
        includeSummary: true,
        history,
      };
    } else if (rolesOf(req.user).includes('student')) {
      options = {
        audience: 'student',
        programIds: await getAllProgramIds(), // handbook passages only
        isAdmin: false,
        scope: null,
        includeSummary: false,
        history,
      };
    } else {
      return res.status(403).json({ success: false, message: 'You do not have access to the assistant.' });
    }

    const result = await answerQuestion(question, options);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ success: false, message: 'The assistant is unavailable right now.' });
  }
};