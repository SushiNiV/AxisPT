const db = require('../Backend/config/db');

/**
 * Run `fn(client)` inside BEGIN/COMMIT on one dedicated connection.
 * Rolls back and rethrows on any error. Always releases the client.
 */
async function withTransaction(fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };