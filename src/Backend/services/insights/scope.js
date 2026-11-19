const db = require('../../config/db');

const rolesOf = (user) => [].concat(user?.role ?? []).map((r) => String(r).toLowerCase());


async function resolveScope(user) {
  if (!user) return null;
  const roles = rolesOf(user);

  if (roles.includes('admin') || roles.includes('superadmin')) {
    return { key: 'admin', programId: null };
  }

  if (roles.includes('faculty') && user.faculty_id) {
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