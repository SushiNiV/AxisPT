let db;
let StudentManageModel;

try {
  db = require('./config/db');
} catch (e) {
  try {
    db = require('../config/db');
  } catch (err) {
    console.error('❌ Could not locate db.js file. Check your require path.');
    process.exit(1);
  }
}

try {
  StudentManageModel = require('./models/StudentManageModel');
} catch (e) {
  try {
    StudentManageModel = require('./StudentManageModel');
  } catch (err) {
    console.error('❌ Could not locate StudentManageModel.js. Check your require path.');
    process.exit(1);
  }
}

async function testGetExistingStudent() {
  let client;
  const targetStudentNumber = '202600025';

  try {
    console.log(`🚀 Connecting to DB to test retrieving student: ${targetStudentNumber}...\n`);
    client = typeof db.getClient === 'function' ? await db.getClient() : db;

    // 1. Locate student_id by joining with users.username
    const lookupRes = await client.query(
      `SELECT s.student_id 
       FROM students s 
       JOIN users u ON s.user_id = u.user_id 
       WHERE u.username = $1 
       LIMIT 1`,
      [targetStudentNumber]
    );

    if (lookupRes.rows.length === 0) {
      console.error(`❌ Student with number '${targetStudentNumber}' was not found in the database.`);
      return;
    }

    const studentId = lookupRes.rows[0].student_id;
    console.log(`📌 Found student ID: ${studentId}. Fetching full profile via StudentManageModel.getById()...\n`);

    // 2. Query full student profile details
    const studentData = await StudentManageModel.getById(studentId);

    console.log('================ RETRIEVED STUDENT DATA ================');
    console.dir(studentData, { depth: null, colors: true });
    console.log('========================================================\n');

    // 3. Validate key expected fields match
    if (
      studentData &&
      (studentData.student_number === targetStudentNumber || studentData.username === targetStudentNumber) &&
      studentData.firstname === 'Matthew' &&
      studentData.lastname === 'Aguilar'
    ) {
      console.log('🎉 SUCCESS! Full student record and relational joins fetched successfully.');
    } else {
      console.warn('⚠️ WARNING: Data retrieved, but some expected values (Name/Student Number) did not match or were missing.');
    }

  } catch (error) {
    console.error('❌ Test failed with database/SQL error:', error);
  } finally {
    if (client && typeof client.release === 'function') {
      client.release();
    }
    process.exit(0);
  }
}

testGetExistingStudent();