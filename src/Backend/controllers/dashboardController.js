'use strict';

/**
 * Dashboard controller: statistics and the AI summary for the signed-in user's
 * scope (all programs for admins, one program for program heads and deans).
 *
 * Conventions: success is { success: true, data }; failures are thrown as
 * HttpError and handled by the global error handler.
 */

const DashboardModel = require('../models/dashboardModel');
const { resolveScope } = require('../services/insights/scope');
const { getSummary } = require('../services/insights/summaryService');
const { HttpError } = require('../../utils/httpError');

/** The user's dashboard scope; 403 if the account has none. */
async function requireScope(user) {
  const scope = await resolveScope(user);
  if (!scope) throw new HttpError(403, 'No dashboard scope assigned to this account.');
  return scope;
}

/** GET /dashboard/stats */
exports.getDashboardStats = async (req, res) => {
  const scope = await requireScope(req.user);
  const stats = await DashboardModel.getStats(scope);
  res.json({ success: true, data: stats });
};

/** GET /dashboard/summary?refresh=1  `refresh=1` skips the summary cache. */
exports.getDashboardSummary = async (req, res) => {
  const scope = await requireScope(req.user);
  const data = await getSummary(scope, { force: req.query.refresh === '1' });
  res.json({ success: true, data });
};