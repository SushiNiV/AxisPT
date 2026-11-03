const DashboardModel = require('../models/dashboardModel');
const { resolveScope } = require('../services/insights/scope');
const { getSummary } = require('../services/insights/summaryService');

exports.getDashboardStats = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);
    if (!scope) return res.status(403).json({ success: false, message: 'No dashboard scope assigned to this account.' });
    const stats = await DashboardModel.getStats(scope);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const scope = await resolveScope(req.user);
    if (!scope) return res.status(403).json({ success: false, message: 'No dashboard scope assigned to this account.' });
    const data = await getSummary(scope, { force: req.query.refresh === '1' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};