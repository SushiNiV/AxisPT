const HistoryModel = require('../models/historyModel');

const logAction = (actionType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (data.success && req.shouldLog !== false) {
        HistoryModel.log({
          userId: req.user?.id,
          targetUserId: req.params.id || req.body.userId || req.user?.id,
          tableName: req.baseUrl.replace('/api/', ''),
          recordId: req.params.id || req.user?.id,
          action: actionType,
          oldValues: req.oldValues || null,
          newValues: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }).catch(console.error);
      }
      originalJson.call(this, data);
    };
    next();
  };
};

module.exports = { logAction };