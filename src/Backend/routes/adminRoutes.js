const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

//auth
router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

//academic year
router.get('/academic-years', verifyToken, adminController.getAcademicYears);
router.post('/academic-years', verifyToken, adminController.addAcademicYear);
router.put('/academic-years/:year_id/semester', verifyToken, adminController.updateAcademicYearSemester);
router.put('/academic-years/:year_id/activate', verifyToken, adminController.activateAcademicYear);
router.put('/academic-years/:year_id', verifyToken, adminController.updateAcademicYear);

//curriculum
router.get('/curricula', verifyToken, adminController.getCurricula);
router.post('/curricula', verifyToken, adminController.addCurriculum);
router.put('/curricula/:curriculum_id', verifyToken, adminController.updateCurriculum);

//program
router.post('/programs', verifyToken, adminController.addProgram);
router.get('/programs', verifyToken, adminController.getPrograms);

//course
router.get('/courses', verifyToken, adminController.getCourses);
router.post('/courses', verifyToken, adminController.addCourse);

//faculty
router.get('/faculties', verifyToken, adminController.getFaculties);

//section
router.get('/sections', verifyToken, adminController.getSectionsByProgram);
router.get('/sections/active', verifyToken, adminController.getActiveSectionsByProgram);
router.get('/sections/all', verifyToken, adminController.getAllSectionsByProgram);
router.post('/section-assignments', verifyToken, adminController.addSectionAssignment);

router.get('/history', verifyToken, adminController.getHistory); 

module.exports = router;