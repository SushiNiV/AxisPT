const db = require('../../config/db');
const GradeManageModel = require('../../models/grademanageModel');

async function getLiveStats({ programIds = [], isAdmin = false } = {}) {
  try {
    const activeStudentsRes = await db.query(`
      SELECT COUNT(*) AS count 
      FROM students 
      WHERE archived_at IS NULL AND account_status = TRUE
    `);
    const totalActiveStudents = parseInt(activeStudentsRes.rows[0].count, 10) || 0;

    const activeProgramsRes = await db.query(`
      SELECT COUNT(*) AS count 
      FROM programs 
      WHERE program_status = TRUE
    `);
    const activePrograms = parseInt(activeProgramsRes.rows[0].count, 10) || 0;

    const activeCoursesRes = await db.query(`
      SELECT COUNT(DISTINCT c.course_id) AS count
      FROM courses c
      JOIN curriculum_courses cc ON cc.course_id = c.course_id
      WHERE c.is_archived IS NOT TRUE
    `);
    const activeCourses = parseInt(activeCoursesRes.rows[0].count, 10) || 0;

    // Students on Probation — derived from grade history via the same
    // function the Student Masterlist uses, so the AI and UI always agree.
    const standingMap = await GradeManageModel.getAcademicStandingMap();
    let studentsOnProbation = 0;
    for (const entry of standingMap.values()) {
      if (entry.status === 'Probationary 1' || entry.status === 'Probationary 2') {
        studentsOnProbation++;
      }
    }

    // 2. Build the text block for the AI
    let text = `Counts as of ${new Date().toISOString().split('T')[0]}:\n`;
    text += `- Active students: ${totalActiveStudents}\n`;
    text += `- Active programs: ${activePrograms}\n`;
    text += `- Active courses: ${activeCourses}\n`;
    text += `- Students on probation (Probationary 1 or 2): ${studentsOnProbation}\n`;
    text += `- Students not on probation (active minus probationary): ${totalActiveStudents - studentsOnProbation}\n`;
    // 3. Admin-only stats
    if (isAdmin) {
      const archivedStudentsRes = await db.query(`
        SELECT COUNT(*) AS count 
        FROM students 
        WHERE archived_at IS NOT NULL
      `);
      const archivedStudents = parseInt(archivedStudentsRes.rows[0].count, 10) || 0;

      const inactiveFacultyRes = await db.query(`
        SELECT COUNT(*) AS count 
        FROM faculties 
        WHERE account_status = FALSE
      `);
      const inactiveFaculty = parseInt(inactiveFacultyRes.rows[0].count, 10) || 0;

      text += `- Archived students: ${archivedStudents}\n`;
      text += `- Inactive faculty accounts: ${inactiveFaculty}\n`;
    }

    // 4. Return in the format answerService.js expects
    return { ok: true, text };

  } catch (error) {
    console.error("Error in getLiveStats:", error);
    return { ok: false, text: 'Live data is currently unavailable.' };
  }
}

module.exports = { getLiveStats };