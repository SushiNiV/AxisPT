const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// --- Notifications ---
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getMyUnreadCount);
router.post('/:id/read', notificationController.markRead);
router.post('/read-all', notificationController.markAllRead);

// --- Announcements ---
// Everyone can GET
router.get('/announcements', notificationController.getAnnouncements);

// Only admin/superadmin can create or delete
router.post('/announcements', requireRole('admin', 'superadmin'), notificationController.createAnnouncement);
router.delete('/announcements/:id', requireRole('admin', 'superadmin'), notificationController.deleteAnnouncement);

module.exports = router;