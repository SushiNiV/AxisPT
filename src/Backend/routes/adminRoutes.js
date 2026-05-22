const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
console.log("DEBUG: adminController exports:", Object.keys(adminController));
const { verifyToken } = require('../middleware/auth');


router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);
router.get('/public/programs', adminController.getPrograms);
router.get('/public/sections', adminController.getSections);
router.get('/public/academic-years', adminController.getAcademicYears);

//Student Management 
router.get('/masterlist', verifyToken, adminController.getMasterlist);
router.get('/pending-students', verifyToken, adminController.getPendingStudents);
router.post('/bulk-accept', verifyToken, adminController.bulkAcceptStudents);
router.post('/bulk-reject', verifyToken, adminController.bulkRejectStudents);

//Academics & Grades
router.post('/add-program', verifyToken, adminController.addProgram);
router.get('/programs', verifyToken, adminController.getPrograms);
router.post('/add-section', verifyToken, adminController.addSection);
router.get('/sections', verifyToken, adminController.getSections);
router.post('/add-course', verifyToken, adminController.addCourse);
router.get('/courses', verifyToken, adminController.getCourses);
router.post('/add-curriculum', verifyToken, adminController.addCurriculum);
router.get('/curricula', verifyToken, adminController.getCurricula);
router.delete('/curriculum/:id', verifyToken, adminController.deleteCurriculum);

//Documents
router.get('/student-form/:id', verifyToken, adminController.getStudentFormData);

//Access Control
router.post('/add-academic-year', verifyToken, adminController.addAcademicYear);
router.get('/academic-years', verifyToken, adminController.getAcademicYears);

router.get('/history', verifyToken, adminController.getHistory);

module.exports = router;