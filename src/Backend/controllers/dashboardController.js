const DashboardModel = require('../models/dashboardModel');

// ==========================================
// DASHBOARD
// ==========================================

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await DashboardModel.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};