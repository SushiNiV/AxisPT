const db = require('../config/db');
const { answerQuestion } = require('../services/rag/answerService');

const MAX_QUESTION_LENGTH = 500;

/**
 * Programs the signed-in user may query.
 * TODO: replace with the real Program Head -> program mapping.
 * As written it returns EVERY program, which is only correct for admins.
 */
async function getAllowedProgramIds(user) {
  const res = await db.query('SELECT program_id FROM programs');
  return res.rows.map((r) => r.program_id);
}

exports.ask = async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
      return res.status(400).json({ success: false, message: 'A question is required.' });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({ success: false, message: `Questions are limited to ${MAX_QUESTION_LENGTH} characters.` });
    }

    const programIds = await getAllowedProgramIds(req.user);
    const result = await answerQuestion(question, { programIds });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ success: false, message: 'The assistant is unavailable right now.' });
  }
};