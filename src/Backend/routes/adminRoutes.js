const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

//auth
router.post('/users', verifyToken, adminController.addUser);
router.get('/users', verifyToken, adminController.getUsers);
router.get('/roles', verifyToken, adminController.getRoles);
router.get('/designations', verifyToken, adminController.getDesignations);

router.post('/login', adminController.login);
router.post('/change-password', verifyToken, adminController.changePassword);

//student management
router.get('/students', verifyToken, adminController.getStudentMasterlist);
router.get('/students/:id', verifyToken, adminController.getStudentById);
router.post('/students', verifyToken, adminController.createStudent);
router.put('/students/:id', verifyToken, adminController.updateStudent);
router.delete('/students/:id', verifyToken, adminController.deleteStudent);

//grade management
router.get('/students/:id/grades', verifyToken, adminController.getStudentGrades);
router.put('/students/:id/grades', verifyToken, adminController.updateStudentGrades);

//documents
router.get('/student-form/:id', verifyToken, adminController.getStudentFormById);
router.get('/term-grade/:id', verifyToken, adminController.getTermGradeById);

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
router.get('/courses/gradable', verifyToken, adminController.getGradableCourses);

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