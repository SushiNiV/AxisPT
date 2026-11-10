const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');
const studentPortalController = require('../controllers/studentPortalController');
const assistantController = require('../controllers/assistantController');

const router = express.Router();

// Applied once for every route below.
router.use(verifyToken, requireRole('student'));

router.get('/grades', studentPortalController.getMyGrades);
router.get('/subjects', studentPortalController.getMySubjects);
router.get('/profile', studentPortalController.getMyProfile);
router.put('/profile', studentPortalController.updateMyProfile);

router.post('/change-password', authController.changePassword);
router.post('/assistant/ask', assistantController.ask);

module.exports = router;