/**
 * Data access for profile photos (table: user_avatars).
 *
 * Paths returned by this module look like `/avatars/<key>?v=<version>`.
 * The key is an unguessable UUID; the version changes whenever the photo does,
 * so browsers can cache each photo "forever" and still pick up changes.
 */
const db = require('../config/db');

/** Seconds-since-epoch of the last change; used as the cache-busting version. */
const VERSION_SQL = 'FLOOR(EXTRACT(EPOCH FROM updated_at))::bigint';

/** Columns every write returns so callers can build the path without a second query. */
const RETURNING_PATH_FIELDS = `avatar_key, image IS NOT NULL AS has_image, ${VERSION_SQL} AS version`;

/** @returns {string|null} Public path for the row, or null when the user has no photo. */
const toPath = (row) => (row && row.has_image ? `/avatars/${row.avatar_key}?v=${row.version}` : null);

/**
 * Current photo path for a user, or null when they have none.
 * Throws on database errors, so callers can tell "no photo" apart from "lookup failed".
 */
exports.findPathByUserId = async (userId) => {
  const { rows } = await db.query(
    `SELECT ${RETURNING_PATH_FIELDS} FROM user_avatars WHERE user_id = $1`,
    [userId]
  );
  return toPath(rows[0]);
};

/**
 * Same lookup, but fails soft. This runs during sign-in, and a photo problem
 * (for example the migration not being applied yet) must never stop anyone from logging in.
 */
exports.getPathByUserId = async (userId) => {
  try {
    return await exports.findPathByUserId(userId);
  } catch (err) {
    console.error('Avatar lookup failed:', err.message);
    return null;
  }
};

/** True if the user has ever had a row (including a "removed" marker). */
exports.hasRow = async (userId) => {
  const { rows } = await db.query('SELECT 1 FROM user_avatars WHERE user_id = $1', [userId]);
  return rows.length > 0;
};

/**
 * Creates or replaces a user's photo.
 * @param {number} userId
 * @param {Buffer} image  Processed WebP bytes.
 * @param {'upload'|'google'} source
 * @returns {Promise<string>} New public path.
 */
exports.save = async (userId, image, source) => {
  const { rows } = await db.query(
    `INSERT INTO user_avatars (user_id, image, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET image = EXCLUDED.image, source = EXCLUDED.source, updated_at = now()
     RETURNING ${RETURNING_PATH_FIELDS}`,
    [userId, image, source]
  );
  return toPath(rows[0]);
};

/**
 * Inserts a photo only if the user has no row at all.
 * Used for the Google import so it can never overwrite an upload or a removal.
 * @returns {Promise<boolean>} True if the photo was stored.
 */
exports.saveIfAbsent = async (userId, image, source) => {
  const { rowCount } = await db.query(
    `INSERT INTO user_avatars (user_id, image, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, image, source]
  );
  return rowCount > 0;
};

/** Removes the photo but keeps a marker row so Google sign-in will not re-import it. */
exports.clear = async (userId) => {
  await db.query(
    `INSERT INTO user_avatars (user_id, image, source)
     VALUES ($1, NULL, 'removed')
     ON CONFLICT (user_id) DO UPDATE
       SET image = NULL, source = 'removed', updated_at = now()`,
    [userId]
  );
};

/** Looks up the image bytes for the public avatar route. Returns undefined if none. */
exports.findByKey = async (avatarKey) => {
  const { rows } = await db.query(
    'SELECT image, content_type FROM user_avatars WHERE avatar_key = $1 AND image IS NOT NULL',
    [avatarKey]
  );
  return rows[0];
};