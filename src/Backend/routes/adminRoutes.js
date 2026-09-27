const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// ==========================================
// IMPORT SEPARATED CONTROLLERS
// ==========================================
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const studentController = require('../controllers/studentController');
const documentController = require('../controllers/documentController');
const academicController = require('../controllers/academicController');
const programController = require('../controllers/programController');
const sectionController = require('../controllers/sectionController');
const courseController = require('../controllers/courseController');
const facultyController = require('../controllers/facultyController');
const historyController = require('../controllers/historyController');
const gradeController = require('../controllers/gradeController');

// ==========================================
// AUTH & USER MANAGEMENT
// ==========================================
router.post('/users', verifyToken, authController.addUser);
router.get('/users', verifyToken, authController.getUsers);
router.get('/roles', verifyToken, authController.getRoles);
router.get('/designations', verifyToken, authController.getDesignations);

router.post('/login', authController.login);
router.post('/change-password', verifyToken, authController.changePassword);

// ==========================================
// DASHBOARD
// ==========================================
router.get('/dashboard/stats', verifyToken, dashboardController.getDashboardStats);

// ==========================================
// STUDENT MANAGEMENT
// ==========================================
router.get('/students', verifyToken, studentController.getStudentMasterlist);
router.delete('/students/batch-delete', verifyToken, studentController.deleteStudentsBulk);
router.get('/students/:id', verifyToken, studentController.getStudentById);
router.post('/students', verifyToken, studentController.createStudent);
router.put('/students/batch-update', verifyToken, studentController.updateStudentsBulk);
router.put('/students/:id', verifyToken, studentController.updateStudent);
router.delete('/students/:id', verifyToken, studentController.deleteStudent);
router.post('/students/:id/restore', verifyToken, studentController.restoreStudent);

// ==========================================
// GRADE MANAGEMENT
// ==========================================
router.get('/students/:id/grades', verifyToken, gradeController.getStudentGrades);
router.put('/students/:id/grades', verifyToken, gradeController.updateStudentGrades);
router.get('/students/:id/gradable-courses', verifyToken, gradeController.getGradableCoursesForStudent);
router.get('/courses/gradable', verifyToken, gradeController.getGradableCourses);

// ==========================================
// DOCUMENTS
// ==========================================
router.get('/student-form/:id', verifyToken, documentController.getStudentFormById);
router.get('/term-grade/:id', verifyToken, documentController.getTermGradeById);
router.get('/course-outline/:id', verifyToken, documentController.getCourseOutlineById);

// ==========================================
// ACADEMIC YEAR
// ==========================================
router.get('/academic-years', verifyToken, academicController.getAcademicYears);
router.post('/academic-years', verifyToken, academicController.addAcademicYear);
router.put('/academic-years/:year_id/semester', verifyToken, academicController.updateAcademicYearSemester);
router.put('/academic-years/:year_id/activate', verifyToken, academicController.activateAcademicYear);
router.put('/academic-years/:year_id', verifyToken, academicController.updateAcademicYear);

// ==========================================
// CURRICULUM
// ==========================================
router.get('/curricula', verifyToken, academicController.getCurricula);
router.post('/curricula', verifyToken, academicController.addCurriculum);
router.put('/curricula/:curriculum_id', verifyToken, academicController.updateCurriculum);

// ==========================================
// PROGRAM
// ==========================================
router.post('/programs', verifyToken, programController.addProgram);
router.get('/programs', verifyToken, programController.getPrograms);
router.put('/programs/:program_id', verifyToken, programController.updateProgram);
router.delete('/programs/:program_id', verifyToken, programController.deleteProgram);
router.post('/programs/:program_id/restore', verifyToken, programController.restoreProgram);

// ==========================================
// COURSE
// ==========================================
router.get('/courses', verifyToken, courseController.getCourses);
router.get('/courses/:id', verifyToken, courseController.getCourseById);
router.post('/courses', verifyToken, courseController.addCourse);
router.put('/courses/:id', verifyToken, courseController.updateCourse);
router.delete('/courses/:id', verifyToken, courseController.deleteCourse);

// ==========================================
// FACULTY
// ==========================================
// ==========================================
// FACULTY
// ==========================================
router.get('/faculties', verifyToken, facultyController.getFaculties);
router.get('/users/:id', verifyToken, facultyController.getFacultyById);       
router.post('/users', verifyToken, facultyController.addFaculty);             
router.put('/users/:id', verifyToken, facultyController.updateFaculty);        
// ==========================================
// SECTION
// ==========================================
router.get('/sections', verifyToken, sectionController.getSectionsByProgram);
router.get('/sections/active', verifyToken, sectionController.getActiveSectionsByProgram);
router.get('/sections/all', verifyToken, sectionController.getAllSectionsByProgram);
router.post('/section-assignments', verifyToken, sectionController.addSectionAssignment);
router.delete('/section-assignments/:assignment_id', verifyToken, sectionController.deleteSectionAssignment);
router.post('/section-assignments/:assignment_id/restore', verifyToken, sectionController.restoreSectionAssignment);
router.put('/section-assignments/:assignment_id', verifyToken, sectionController.updateSectionAssignment);
router.get('/sections/by-program/:programId', verifyToken, sectionController.getSectionsByProgramId);
router.get('/sections/archived', verifyToken, sectionController.getArchivedSections);
// ==========================================
// HISTORY
// ==========================================
router.get('/history', verifyToken, historyController.getHistory);

module.exports = router;