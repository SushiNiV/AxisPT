const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const studentPortalController = require('../controllers/studentPortalController');

router.use(verifyToken, requireRole('student'));

router.get('/grades', studentPortalController.getMyGrades);
router.get('/subjects', studentPortalController.getMySubjects);
router.get('/profile', studentPortalController.getMyProfile);
router.put('/profile', studentPortalController.updateMyProfile);

module.exports = router;