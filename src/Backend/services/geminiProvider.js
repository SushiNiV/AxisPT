/**
 * Gemini provider: the only file that knows about Google's SDK.
 * Switching to another provider (e.g. Azure OpenAI) later means rewriting just this module.
 *
 * Requires in .env:
 *   GEMINI_API_KEY, GEMINI_EMBED_MODEL, GEMINI_CHAT_MODEL
 */
const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing. Add it to .env and make sure dotenv is loaded first.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL;
const EMBED_DIMENSIONS = 768; // must match vector(768) in kb_chunks

/**
 * Embed an array of strings.
 * @param {string[]} texts
 * @param {'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'} taskType
 *   RETRIEVAL_DOCUMENT when indexing text, RETRIEVAL_QUERY for user questions.
 * @returns {Promise<number[][]>} one vector per input text
 */
async function embed(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { taskType, outputDimensionality: EMBED_DIMENSIONS },
  });
  return res.embeddings.map((e) => e.values);
}

/**
 * Generate a text answer.
 * @param {{ system: string, prompt: string }} args
 * @returns {Promise<string>}
 */
async function generate({ system, prompt }) {
  if (!CHAT_MODEL) throw new Error('GEMINI_CHAT_MODEL is missing in .env.');
  const res = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: prompt,
    config: { systemInstruction: system, temperature: 0.2 },
  });
  return res.text;
}

module.exports = { embed, generate, EMBED_DIMENSIONS };