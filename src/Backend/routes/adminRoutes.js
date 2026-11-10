const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const studentController = require('../controllers/studentController');
const documentController = require('../controllers/documentController');
const academicController = require('../controllers/academicController');
const programController = require('../controllers/programController');
const sectionController = require('../controllers/sectionController');
const courseController = require('../controllers/courseController');
const staffController = require('../controllers/facultyController');
const historyController = require('../controllers/historyController');
const gradeController = require('../controllers/gradeController');
const assistantController = require('../controllers/assistantController');

const router = express.Router();

// Middleware presets: define once, spread into each route.
const anyRole   = [verifyToken, requireRole('admin', 'faculty', 'student')];
const staff     = [verifyToken, requireRole('admin', 'faculty')];
const adminOnly = [verifyToken, requireRole('admin')];

// NOTE: /login and /google are mounted in Server.js under /api/auth.

// ---------- Auth ----------
router.post('/change-password', verifyToken, authController.changePassword);

// ---------- Staff accounts (admin + faculty) ----------
// "Users" here are staff accounts, and :id is always the user_id.
router.get('/roles', ...adminOnly, staffController.roles);
router.get('/designations', ...adminOnly, staffController.designations);

router.get('/users', ...adminOnly, staffController.list);
router.post('/users', ...adminOnly, staffController.create);
router.get('/users/:id', ...adminOnly, staffController.getById);
router.put('/users/:id', ...adminOnly, staffController.update);
router.delete('/users/:id', ...adminOnly, staffController.remove);
router.post('/users/:id/restore', ...adminOnly, staffController.restore);

// Same list, also open to faculty (adviser dropdowns, etc.).
router.get('/faculties', ...staff, staffController.list);

// ---------- AI assistant ----------
router.post('/assistant/ask', ...anyRole, assistantController.ask);

// ---------- Dashboard ----------
router.get('/dashboard/stats', ...staff, dashboardController.getDashboardStats);
router.get('/dashboard/summary', ...staff, dashboardController.getDashboardSummary);

// ---------- Students ----------
// Static paths (batch-*) must stay above '/:id'.
router.get('/students', ...staff, studentController.getStudentMasterlist);
router.post('/students', ...staff, studentController.createStudent);
router.put('/students/batch-update', ...staff, studentController.updateStudentsBulk);
router.delete('/students/batch-delete', ...staff, studentController.deleteStudentsBulk);
router.get('/students/:id', ...staff, studentController.getStudentById);
router.put('/students/:id', ...staff, studentController.updateStudent);
router.put('/students/:id/status', ...staff, studentController.updateStudentStatus);
router.delete('/students/:id', ...staff, studentController.deleteStudent);
router.post('/students/:id/restore', ...staff, studentController.restoreStudent);

// ---------- Grades ----------
router.get('/students/:id/grades', ...staff, gradeController.getStudentGrades);
router.put('/students/:id/grades', ...staff, gradeController.updateStudentGrades);
router.get('/students/:id/grades/archived', ...staff, gradeController.getArchivedStudentGrades);
router.get('/students/:id/gradable-courses', ...staff, gradeController.getGradableCoursesForStudent);
router.post('/students/:id/grades/:courseId/archive', ...staff, gradeController.archiveStudentGrade);
router.post('/students/:id/grades/:courseId/restore', ...staff, gradeController.restoreStudentGrade);
router.delete('/students/:id/grades/:courseId/empty', ...staff, gradeController.deleteEmptyStudentGrade);
router.get('/courses/gradable', ...staff, gradeController.getGradableCourses); // keep above '/courses/:id'

// ---------- Documents ----------
router.get('/student-form/:id', ...staff, documentController.getStudentFormById);
router.get('/term-grade/:id', ...staff, documentController.getTermGradeById);
router.get('/course-outline/:id', ...staff, documentController.getCourseOutlineById);

// ---------- Academic years (admin) ----------
router.get('/academic-years', ...adminOnly, academicController.getAcademicYears);
router.post('/academic-years', ...adminOnly, academicController.addAcademicYear);
router.put('/academic-years/:year_id/semester', ...adminOnly, academicController.updateAcademicYearSemester);
router.put('/academic-years/:year_id/activate', ...adminOnly, academicController.activateAcademicYear);
router.put('/academic-years/:year_id', ...adminOnly, academicController.updateAcademicYear);

// ---------- Curricula (admin) ----------
router.get('/curricula', ...adminOnly, academicController.getCurricula);
router.post('/curricula', ...adminOnly, academicController.addCurriculum);
router.put('/curricula/:curriculum_id', ...adminOnly, academicController.updateCurriculum);

// ---------- Programs (read: staff, write: admin) ----------
router.get('/programs', ...staff, programController.getPrograms);
router.post('/programs', ...adminOnly, programController.addProgram);
router.put('/programs/:program_id', ...adminOnly, programController.updateProgram);
router.delete('/programs/:program_id', ...adminOnly, programController.deleteProgram);
router.post('/programs/:program_id/restore', ...adminOnly, programController.restoreProgram);

// ---------- Courses (read: staff, write: admin) ----------
router.get('/courses', ...staff, courseController.getCourses);
router.get('/courses/:id', ...staff, courseController.getCourseById);
router.post('/courses', ...adminOnly, courseController.addCourse);
router.put('/courses/:id', ...adminOnly, courseController.updateCourse);
router.delete('/courses/:id', ...adminOnly, courseController.deleteCourse);
router.post('/courses/:id/restore', ...adminOnly, courseController.restoreCourse);

// ---------- Sections (read: staff, archived + assignments: admin) ----------
router.get('/sections', ...staff, sectionController.getSectionsByProgram);
router.get('/sections/active', ...staff, sectionController.getActiveSectionsByProgram);
router.get('/sections/all', ...staff, sectionController.getAllSectionsByProgram);
router.get('/sections/by-program/:programId', ...staff, sectionController.getSectionsByProgramId);
router.get('/sections/archived', ...adminOnly, sectionController.getArchivedSections);
router.post('/section-assignments', ...adminOnly, sectionController.addSectionAssignment);
router.put('/section-assignments/:assignment_id', ...adminOnly, sectionController.updateSectionAssignment);
router.delete('/section-assignments/:assignment_id', ...adminOnly, sectionController.deleteSectionAssignment);
router.post('/section-assignments/:assignment_id/restore', ...adminOnly, sectionController.restoreSectionAssignment);

// ---------- History (admin) ----------
router.get('/history', ...adminOnly, historyController.getHistory);

module.exports = router;