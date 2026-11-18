const db = require('../../config/db');
const DashboardModel = require('../../models/dashboardModel');

const TTL_MS = 60 * 1000; // getStats runs several queries, so cache briefly per scope
const cache = new Map();

/**
 * Live counts for the assistant, limited to the caller's scope.
 * Built on DashboardModel.getStats so the chatbot, the dashboard and the
 * dashboard summary always agree. Fails closed when no scope is given.
 */
async function getLiveStats({ scope = null } = {}) {
  if (!scope) return { ok: false, text: 'Live data is currently unavailable.' };

  const hit = cache.get(scope.key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  try {
    const isAdmin = scope.programId === null;
    const s = await DashboardModel.getStats(scope);
    const standing = (name) => s.standingCounts.find((x) => x.status === name)?.count || 0;

    const totalActiveStudents = s.totals.active_students;
    const studentsOnProbation = standing('Probationary 1') + standing('Probationary 2');

    let text = `Counts as of ${new Date().toISOString().split('T')[0]}:\n`;
    text += `- Scope: ${isAdmin ? 'all programs' : 'the user\'s own program only'}\n`;
    text += `- Active students: ${totalActiveStudents}\n`;
    text += `- Active programs: ${s.totals.active_programs}\n`;
    text += `- Active courses: ${s.totals.active_courses}\n`;
    text += `- Students on warning: ${standing('Warning')}\n`;
    text += `- Students on probation (Probationary 1 or 2): ${studentsOnProbation}\n`;
    text += `- Students not on probation (active minus probationary): ${totalActiveStudents - studentsOnProbation}\n`;

    // Admin-only, institution-wide stats
    if (isAdmin) {
      const archivedStudentsRes = await db.query(
        'SELECT COUNT(*) AS count FROM students WHERE archived_at IS NOT NULL'
      );
      const inactiveFacultyRes = await db.query(
        'SELECT COUNT(*) AS count FROM faculties WHERE account_status = FALSE'
      );
      text += `- Archived students: ${parseInt(archivedStudentsRes.rows[0].count, 10) || 0}\n`;
      text += `- Inactive faculty accounts: ${parseInt(inactiveFacultyRes.rows[0].count, 10) || 0}\n`;
    }

    const value = { ok: true, text };
    cache.set(scope.key, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error('Error in getLiveStats:', error);
    return { ok: false, text: 'Live data is currently unavailable.' };
  }
}

module.exports = { getLiveStats };