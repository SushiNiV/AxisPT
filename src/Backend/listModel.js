require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
  const embed = [];
  const chat = [];

  const pager = await ai.models.list();
  for await (const m of pager) {
    const id = m.name.replace(/^models\//, '');
    const actions = m.supportedActions || [];
    if (actions.includes('embedContent')) embed.push(id);
    if (actions.includes('generateContent')) chat.push(id);
  }

  console.log('\nEMBEDDING models:\n ', embed.join('\n  '));
  console.log('\nCHAT models:\n ', chat.join('\n  '));
})().catch(console.error);