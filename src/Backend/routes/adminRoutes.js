const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');

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
const assistantController = require('../controllers/assistantController');

// ==========================================
// AUTH & USER MANAGEMENT — ADMIN ONLY (except login, change-password)
// ==========================================
// Note: /login and /google are handled directly in Server.js under /api/auth
router.post('/change-password', verifyToken, authController.changePassword);

router.get('/users',              verifyToken, requireRole('admin'), authController.getUsers);
router.post('/users',             verifyToken, requireRole('admin'), authController.addUser);
router.get('/roles',              verifyToken, requireRole('admin'), authController.getRoles);
router.get('/designations',       verifyToken, requireRole('admin'), authController.getDesignations);

// ==========================================
// AI — BOTH ROLES
// ==========================================
router.post('/assistant/ask', verifyToken, requireRole('admin', 'faculty', 'student'), assistantController.ask);

// ==========================================
// DASHBOARD — BOTH ROLES
// ==========================================
router.get('/dashboard/stats', verifyToken, requireRole('admin', 'faculty'), dashboardController.getDashboardStats);
router.get('/dashboard/summary', verifyToken, requireRole('admin', 'faculty'), dashboardController.getDashboardSummary);

// ==========================================
// STUDENT MANAGEMENT — BOTH ROLES
// ==========================================
router.get('/students',                    verifyToken, requireRole('admin', 'faculty'), studentController.getStudentMasterlist);
router.post('/students',                   verifyToken, requireRole('admin', 'faculty'), studentController.createStudent);

router.put('/students/batch-update',       verifyToken, requireRole('admin', 'faculty'), studentController.updateStudentsBulk);
router.delete('/students/batch-delete',    verifyToken, requireRole('admin', 'faculty'), studentController.deleteStudentsBulk);

router.get('/students/:id',                verifyToken, requireRole('admin', 'faculty'), studentController.getStudentById);
router.put('/students/:id',                verifyToken, requireRole('admin', 'faculty'), studentController.updateStudent);
router.put('/students/:id/status',         verifyToken, requireRole('admin', 'faculty'), studentController.updateStudentStatus);
router.delete('/students/:id',             verifyToken, requireRole('admin', 'faculty'), studentController.deleteStudent);
router.post('/students/:id/restore',       verifyToken, requireRole('admin', 'faculty'), studentController.restoreStudent);

// ==========================================
// GRADE MANAGEMENT — BOTH ROLES
// ==========================================
router.get('/students/:id/grades',                     verifyToken, requireRole('admin', 'faculty'), gradeController.getStudentGrades);
router.put('/students/:id/grades',                     verifyToken, requireRole('admin', 'faculty'), gradeController.updateStudentGrades);
router.get('/students/:id/gradable-courses',           verifyToken, requireRole('admin', 'faculty'), gradeController.getGradableCoursesForStudent);
router.get('/courses/gradable',                        verifyToken, requireRole('admin', 'faculty'), gradeController.getGradableCourses);
router.post('/students/:id/grades/:courseId/archive',  verifyToken, requireRole('admin', 'faculty'), gradeController.archiveStudentGrade);
router.post('/students/:id/grades/:courseId/restore',  verifyToken, requireRole('admin', 'faculty'), gradeController.restoreStudentGrade);
router.get('/students/:id/grades/archived', verifyToken, requireRole('admin', 'faculty'), gradeController.getArchivedStudentGrades);
router.delete('/students/:id/grades/:courseId/empty', verifyToken, requireRole('admin', 'faculty'), gradeController.deleteEmptyStudentGrade);

// ==========================================
// DOCUMENTS — BOTH ROLES
// ==========================================
router.get('/student-form/:id',    verifyToken, requireRole('admin', 'faculty'), documentController.getStudentFormById);
router.get('/term-grade/:id',      verifyToken, requireRole('admin', 'faculty'), documentController.getTermGradeById);
router.get('/course-outline/:id',  verifyToken, requireRole('admin', 'faculty'), documentController.getCourseOutlineById);

// ==========================================
// ACADEMIC YEAR — ADMIN ONLY
// ==========================================
router.get('/academic-years',                          verifyToken, requireRole('admin'), academicController.getAcademicYears);
router.post('/academic-years',                         verifyToken, requireRole('admin'), academicController.addAcademicYear);
router.put('/academic-years/:year_id/semester',        verifyToken, requireRole('admin'), academicController.updateAcademicYearSemester);
router.put('/academic-years/:year_id/activate',        verifyToken, requireRole('admin'), academicController.activateAcademicYear);
router.put('/academic-years/:year_id',                 verifyToken, requireRole('admin'), academicController.updateAcademicYear);

// ==========================================
// CURRICULUM — ADMIN ONLY
// ==========================================
router.get('/curricula',                       verifyToken, requireRole('admin'), academicController.getCurricula);
router.post('/curricula',                      verifyToken, requireRole('admin'), academicController.addCurriculum);
router.put('/curricula/:curriculum_id',        verifyToken, requireRole('admin'), academicController.updateCurriculum);

// ==========================================
// PROGRAM — GET both roles; mutations admin only
// ==========================================
router.get('/programs',                          verifyToken, requireRole('admin', 'faculty'), programController.getPrograms);
router.post('/programs',                         verifyToken, requireRole('admin'), programController.addProgram);
router.put('/programs/:program_id',              verifyToken, requireRole('admin'), programController.updateProgram);
router.delete('/programs/:program_id',           verifyToken, requireRole('admin'), programController.deleteProgram);
router.post('/programs/:program_id/restore',     verifyToken, requireRole('admin'), programController.restoreProgram);

// ==========================================
// COURSE — GET both roles; mutations admin only
// ==========================================
router.get('/courses',          verifyToken, requireRole('admin', 'faculty'), courseController.getCourses);
router.get('/courses/:id',      verifyToken, requireRole('admin', 'faculty'), courseController.getCourseById);
router.post('/courses',         verifyToken, requireRole('admin'), courseController.addCourse);
router.put('/courses/:id',      verifyToken, requireRole('admin'), courseController.updateCourse);
router.delete('/courses/:id',   verifyToken, requireRole('admin'), courseController.deleteCourse);
router.post('/courses/:id/restore', verifyToken, requireRole('admin'), courseController.restoreCourse);

// ==========================================
// USER / FACULTY MANAGEMENT — ADMIN ONLY
// ==========================================
router.get('/users',              verifyToken, requireRole('admin'), facultyController.getFaculties);
router.get('/users/:id',          verifyToken, requireRole('admin'), facultyController.getFacultyById);
router.post('/users',             verifyToken, requireRole('admin'), facultyController.addFaculty);
router.put('/users/:id',          verifyToken, requireRole('admin'), facultyController.updateFaculty);
router.delete('/users/:id',       verifyToken, requireRole('admin'), facultyController.deleteFaculty);
router.post('/users/:id/restore', verifyToken, requireRole('admin'), facultyController.restoreFaculty);

// Keep /faculties as alias if needed elsewhere
router.get('/faculties', verifyToken, requireRole('admin', 'faculty'), facultyController.getFaculties);

// Roles & designations from authController (separate concern)
router.get('/roles',              verifyToken, requireRole('admin'), authController.getRoles);
router.get('/designations',       verifyToken, requireRole('admin'), authController.getDesignations);

// ==========================================
// SECTION — GET both roles; mutations & archived admin only
// ==========================================
router.get('/sections',                                       verifyToken, requireRole('admin', 'faculty'), sectionController.getSectionsByProgram);
router.get('/sections/active',                                verifyToken, requireRole('admin', 'faculty'), sectionController.getActiveSectionsByProgram);
router.get('/sections/all',                                   verifyToken, requireRole('admin', 'faculty'), sectionController.getAllSectionsByProgram);
router.get('/sections/by-program/:programId',                 verifyToken, requireRole('admin', 'faculty'), sectionController.getSectionsByProgramId);
router.get('/sections/archived',                              verifyToken, requireRole('admin'), sectionController.getArchivedSections);
router.post('/section-assignments',                           verifyToken, requireRole('admin'), sectionController.addSectionAssignment);
router.put('/section-assignments/:assignment_id',             verifyToken, requireRole('admin'), sectionController.updateSectionAssignment);
router.delete('/section-assignments/:assignment_id',          verifyToken, requireRole('admin'), sectionController.deleteSectionAssignment);
router.post('/section-assignments/:assignment_id/restore',    verifyToken, requireRole('admin'), sectionController.restoreSectionAssignment);

// ==========================================
// HISTORY — ADMIN ONLY
// ==========================================
router.get('/history', verifyToken, requireRole('admin'), historyController.getHistory);

module.exports = router;