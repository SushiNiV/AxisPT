const db = require('../../config/db');

/**
 * Resolve the data scope from the VERIFIED JWT (req.user).
 * Fails closed: returns null when no valid scope exists.
 */
async function resolveScope(user) {
  if (!user) return null;
  if (user.role === 'admin') return { key: 'admin', programId: null };

  if (user.role === 'faculty' && user.faculty_id) {
    const r = await db.query(
      'SELECT program_id FROM faculties WHERE faculty_id = $1 AND account_status = TRUE',
      [user.faculty_id]
    );
    const programId = r.rows[0]?.program_id;
    if (programId) return { key: `program:${programId}`, programId };
  }
  return null;
}

module.exports = { resolveScope };