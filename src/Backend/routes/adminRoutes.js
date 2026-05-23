const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

router.get('/academic-years', verifyToken, adminController.getAcademicYears);
router.post('/academic-years', verifyToken, adminController.addAcademicYear);
router.put('/academic-years/:year_id/semester', verifyToken, adminController.updateAcademicYearSemester);
router.put('/academic-years/:year_id/activate', verifyToken, adminController.activateAcademicYear);
router.put('/academic-years/:year_id', verifyToken, adminController.updateAcademicYear);

router.get('/curricula', verifyToken, adminController.getCurricula);
router.post('/curricula', verifyToken, adminController.addCurriculum);

router.post('/programs', verifyToken, adminController.addProgram);
router.get('/programs', verifyToken, adminController.getPrograms);

router.get('/faculties', verifyToken, adminController.getFaculties);

router.get('/sections', verifyToken, adminController.getSectionsByProgram);
router.get('/sections/active', verifyToken, adminController.getActiveSectionsByProgram);
router.get('/sections/all', verifyToken, adminController.getAllSectionsByProgram);
router.post('/section-assignments', verifyToken, adminController.addSectionAssignment);

router.get('/history', verifyToken, adminController.getHistory); 

module.exports = router;