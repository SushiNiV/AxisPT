'use strict';

const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

const anyRole = [verifyToken, requireRole('admin', 'faculty', 'student')];
const adminOnly = [verifyToken, requireRole('admin')];

// ---------- The signed-in user's notifications ----------
router.get('/', ...anyRole, notificationController.getMyNotifications);
router.get('/unread-count', ...anyRole, notificationController.getMyUnreadCount);
router.post('/read-all', ...anyRole, notificationController.markAllRead);
router.post('/:id/read', ...anyRole, notificationController.markRead);

// ---------- Announcements ----------
router.get('/announcements', ...anyRole, notificationController.getAnnouncements);
router.post('/announcements', ...adminOnly, notificationController.createAnnouncement);
router.delete('/announcements/:id', ...adminOnly, notificationController.deleteAnnouncement);

module.exports = router;