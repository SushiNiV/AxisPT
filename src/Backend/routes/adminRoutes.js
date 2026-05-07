const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const { verifyToken } = require('../middleware/auth');


router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

//Student Management 
router.get('/masterlist', verifyToken, adminController.getMasterlist);
router.get('/pending-students', verifyToken, adminController.getPendingStudents);
router.post('/bulk-accept', verifyToken, adminController.bulkAcceptStudents);
router.post('/bulk-reject', verifyToken, adminController.bulkRejectStudents);

//Academics & Grades
router.post('/add-program', verifyToken, adminController.addProgram);
router.get('/programs', verifyToken, adminController.getPrograms);

//Documents
router.get('/student-form/:id', verifyToken, adminController.getStudentFormData);

router.get('/history', verifyToken, adminController.getHistory);

module.exports = router;