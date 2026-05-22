// backend/fix-ordinal-position.js
const { newPool } = require('./config/db');

async function fixOrdinal() {
  try {
    await newPool.query(`ALTER TABLE student_family ALTER COLUMN ordinal_position TYPE varchar`);
    console.log('✅ ordinal_position changed to varchar');
  } catch(e) {
    console.log('Error:', e.message);
  }
  await newPool.end();
}

fixOrdinal();