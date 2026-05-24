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
router.get('/ai-report', verifyToken, adminController.getAIReport);


//Student Management 
router.get('/masterlist', verifyToken, adminController.getMasterlist);
router.get('/pending-students', verifyToken, adminController.getPendingStudents);
router.post('/bulk-accept', verifyToken, adminController.bulkAcceptStudents);
router.post('/bulk-reject', verifyToken, adminController.bulkRejectStudents);
router.get('/student-courses/:id', verifyToken, adminController.getStudentCourses);
router.post('/save-grades', verifyToken, adminController.saveGrades);
router.post('/save-grade-details', verifyToken, adminController.saveGradeDetails);
router.get('/grade-details/:studentId/:courseId', verifyToken, adminController.getGradeDetails);


//Academics & Grades
router.post('/add-program', verifyToken, adminController.addProgram);
router.get('/programs', verifyToken, adminController.getPrograms);
router.post('/add-section', verifyToken, adminController.addSection);
router.get('/sections', verifyToken, adminController.getSections);
router.post('/add-course', verifyToken, adminController.addCourse);
router.get('/courses', verifyToken, adminController.getCourses);


//Documents
router.get('/student-form/:id', verifyToken, adminController.getStudentFormData);

//Access Control
router.post('/add-academic-year', verifyToken, adminController.addAcademicYear);
router.get('/academic-years', verifyToken, adminController.getAcademicYears);
router.post('/add-curriculum', verifyToken, adminController.addCurriculum);
router.get('/curricula', verifyToken, adminController.getCurricula);
router.delete('/curriculum/:id', verifyToken, adminController.deleteCurriculum);
router.get('/users', verifyToken, adminController.getUsers);
router.post('/users', verifyToken, adminController.createUser);
router.put('/users/:id/toggle', verifyToken, adminController.toggleUser);


router.get('/history', verifyToken, adminController.getHistory);
router.get('/analytics', verifyToken, adminController.getAnalytics);

module.exports = router;