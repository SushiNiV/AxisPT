/**
 * Profile photo routes. Mount at `/api/avatars` in Server.js.
 *
 * IMPORTANT: mount this BEFORE the global `app.use(express.json())`, otherwise
 * the global parser's default 100 KB limit rejects uploads before the route-level
 * parser below ever runs.
 */
const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const avatarController = require('../controllers/avatarController');

const router = express.Router();
const ALL_ROLES = ['admin', 'faculty', 'student'];

// A 1 MB image becomes about 1.4 MB once base64-encoded inside the JSON body.
const parseAvatarBody = express.json({ limit: '1.5mb' });

// Authenticate first, so unauthenticated callers never get their body read.
router.post('/me', verifyToken, requireRole(...ALL_ROLES), parseAvatarBody, avatarController.upload);
router.delete('/me', verifyToken, requireRole(...ALL_ROLES), avatarController.remove);

// Public: <img> tags cannot send an Authorization header.
router.get('/me', verifyToken, requireRole(...ALL_ROLES), avatarController.getMine);
router.get('/:key', avatarController.serve);

module.exports = router;