const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const { verifyToken } = require('../middleware/auth');

router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);
router.get('/pending-students', verifyToken, adminController.getPendingStudents);

module.exports = router;