const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');

router.post('/registration', studentController.registerStudent);
router.post('/login', studentController.loginStudent);
router.post('/student-change-password', verifyToken, studentController.changePassword);


module.exports = router;