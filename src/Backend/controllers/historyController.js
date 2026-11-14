'use strict';

/**
 * History controller: the audit log for the History page (admin only).
 * Row formatting lives in services/historyFormatter.js.
 *
 * Conventions: success is { success: true, history }; failures are thrown as
 * HttpError and handled by the global error handler.
 */

const HistoryModel = require('../models/historyModel');
const { formatHistoryEntry } = require('../services/historyformatter');
const HttpError = require('../../utils/httpError');

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

/**
 * Parse an optional whole-number query value. Missing values use the fallback;
 * values above `max` are lowered to it; non-numbers and negatives are rejected.
 */
function parsePagingValue(value, { name, min, max = Number.MAX_SAFE_INTEGER, fallback }) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) {
    throw new HttpError(400, `${name} must be a whole number of at least ${min}.`);
  }
  return Math.min(n, max);
}

/** GET /history?limit=&offset=  Newest first. limit is capped at 500. */
exports.getHistory = async (req, res) => {
  const limit = parsePagingValue(req.query.limit, { name: 'limit', min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE });
  const offset = parsePagingValue(req.query.offset, { name: 'offset', min: 0, fallback: 0 });

  const rows = await HistoryModel.getHistoryLogs({ limit, offset });
  res.json({ success: true, history: rows.map(formatHistoryEntry) });
};