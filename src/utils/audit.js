const HistoryModel = require('../Backend/models/historyModel');
const { getClientInfo } = require('./request');

/**
 * Write one audit entry. Replaces the userId / ipAddress / userAgent boilerplate
 * that every controller repeated. Never throws: a failed log must not fail a
 * request that already succeeded.
 *
 * `targetUserId` defaults to the caller (what the course code always did);
 * pass it explicitly to override.
 */
async function audit(req, entry) {
  const userId = req.user?.id || null;
  try {
    await HistoryModel.log({ userId, targetUserId: userId, ...getClientInfo(req), ...entry });
  } catch (err) {
    console.error('History log failed:', err.message);
  }
}

module.exports = { audit };