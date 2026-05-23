const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

router.get('/academic-years', verifyToken, adminController.getAcademicYears);
router.post('/academic-years', verifyToken, adminController.addAcademicYear);
router.put('/academic-years/:year_id', verifyToken, adminController.updateAcademicYear);
router.delete('/academic-years/:year_id', verifyToken, adminController.deleteAcademicYear);
router.put('/academic-years/:year_id/activate', verifyToken, adminController.activateAcademicYear);
router.put('/academic-years/:year_id/semester', verifyToken, adminController.updateAcademicYearSemester);

router.get('/curricula', verifyToken, adminController.getCurricula);
router.post('/curricula', verifyToken, adminController.addCurriculum);
router.put('/curricula/:curriculum_id', verifyToken, adminController.updateCurriculum);
router.delete('/curricula/:curriculum_id', verifyToken, adminController.deleteCurriculum);

router.post('/programs', verifyToken, adminController.addProgram);
router.put('/programs/:program_id', verifyToken, adminController.updateProgram);
router.get('/programs', verifyToken, adminController.getPrograms);

router.get('/history', verifyToken, adminController.getHistory); 

module.exports = router;