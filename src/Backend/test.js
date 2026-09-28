require('dotenv').config();
const { retrieve } = require('../Backend/services/rag/ragStore');
const { answerQuestion } = require('../Backend/services/rag/answerService');

const questions = [
  'What happens if a student fails two courses?',   // should match
  'How is the grading scale set up?',                // should match
  'Who won the basketball finals last year?',        // should NOT match
];

(async () => {
  for (const q of questions) {
    const hits = await retrieve(q, { k: 1 });
    console.log(q, '->', hits[0] ? hits[0].distance.toFixed(3) : 'no hits');
  }

  console.log('\n--- full answer ---');
  console.log(await answerQuestion(questions[0], { programIds: [] }));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });