// backend/drop-course-columns.js
const { newPool } = require('./config/db');

async function dropColumns() {
  try {
    await newPool.query(`ALTER TABLE courses DROP COLUMN IF EXISTS year_level_offered`);
    console.log('✅ year_level_offered dropped');
    
    await newPool.query(`ALTER TABLE courses DROP COLUMN IF EXISTS semester_offered`);
    console.log('✅ semester_offered dropped');
    
    // Verify
    const result = await newPool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Remaining columns:');
    result.rows.forEach(c => console.log('  -', c.column_name));
    
  } catch(e) {
    console.log('Error:', e.message);
  }
  await newPool.end();
}

dropColumns();