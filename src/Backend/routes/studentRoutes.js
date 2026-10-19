const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const studentPortalController = require('../controllers/studentPortalController');

router.use(verifyToken, requireRole('student'));

router.get('/grades',  verifyToken, studentPortalController.getMyGrades);
router.get('/subjects',  verifyToken, studentPortalController.getMySubjects);
router.get('/profile',  verifyToken, studentPortalController.getMyProfile);
router.put('/profile',  verifyToken, studentPortalController.updateMyProfile);

module.exports = router;