/**
 * Turns a question into a grounded answer using handbook passages AND live dashboard counts.
 */
const { generate } = require('../geminiProvider');
const { retrieve } = require('./ragStore');
const { getLiveStats } = require('./liveStats');

const TOP_K = 5;
// Cosine distance: lower = more similar. Tune this from real retrieval logs.
const MAX_DISTANCE = Number(process.env.RAG_MAX_DISTANCE || 0.45);

const NO_ANSWER = "I don't have that information in the current knowledge base.";

const SYSTEM_PROMPT = `
You are the AxisPT Academic Assistant for Our Lady of Fatima University. You are helpful, conversational, and polite.

You have access to:
1. The Student Handbook (provided in <passages>)
2. Live database counts (provided in <live_stats>)

RULES FOR ANSWERING:
- If asked "who are you?" or for an introduction, say: "Hello! I am the AxisPT Academic Assistant. I can help you with academic policies, student handbook guidelines, and general program statistics. How can I help you today?"
- If the user asks a policy question (e.g., "What is the probation policy?", "How is GWA computed?", "What are the Latin Honor requirements?"), answer clearly using the <passages>. Format lists using proper Markdown (e.g., "- " for bullets).
- If the user asks for aggregate counts (e.g., "How many students are enrolled?", "How many are on probation?"), look at the <live_stats> and provide the exact number.
- If the user asks for a LIST of specific students (e.g., "Who is running for Latin honors?", "List the students on probation"), politely explain that you can only provide aggregate numbers and cannot access individual student records.
- If the user asks a meta-question (e.g., "What can I ask you?", "What do you know?"), reply conversationally: "I can help you with questions about the Student Handbook (like grading systems, probation policies, and graduation requirements) and provide real-time counts for enrollment or probation."
- If the <passages> don't contain the answer, say: "I couldn't find a specific policy for that in the handbook. Could you try rephrasing your question?"
- NEVER invent data or assume a specific user role (like Program Head or Admin). Treat everyone as a general portal user. ONLY use the provided <passages> and <live_stats>.

Answer naturally, like a helpful university staff member.
`;

/**
 * @param {string} question
 * @param {{programIds: number[], isAdmin?: boolean}} scope  
 * @returns {Promise<{answer:string, sources:Array, refused:boolean, liveData:'ok'|'unavailable'}>}
 */
async function answerQuestion(question, { programIds, isAdmin = false }) {
  const [hits, stats] = await Promise.all([
    retrieve(question, { programIds, k: TOP_K }),
    getLiveStats({ programIds, isAdmin }),
  ]);
  const relevant = hits.filter((h) => h.distance <= MAX_DISTANCE);
  const liveData = stats.ok ? 'ok' : 'unavailable';

  const passages = relevant.length
    ? relevant.map((h, i) => `[${i + 1}] (${h.title})\n${h.content}`).join('\n\n')
    : '(No specific handbook passages matched this question)';
    
  const statsBlock = stats.ok ? stats.text : 'Live data is currently unavailable.';

  const prompt =
    `<passages>\n${passages}\n</passages>\n\n` +
    `<live_stats>\n${statsBlock}\n</live_stats>\n\n` +
    `Question: ${question}`;

  // ALWAYS let Gemini try to answer. If it's a conversational question, 
  // the system prompt will guide it. If it's a policy question not found in 
  // passages, it will output the refusal string.
  const answer = await generate({ system: SYSTEM_PROMPT, prompt });

  return {
    answer,
    refused: answer.trim() === NO_ANSWER || answer.includes("I don't have that information"),
    liveData,
    sources: relevant.map((h, i) => ({
      n: i + 1,
      title: h.title,
      source: h.source,
      distance: Number(h.distance.toFixed(3)),
    })),
  };
}

module.exports = { answerQuestion, NO_ANSWER };