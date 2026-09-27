const db = require('../config/db');
const DocumentModel = require('../models/documentModel');

// ==========================================
// DOCUMENT GENERATION
// ==========================================

exports.getStudentFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await DocumentModel.getStudentFormData(id);
    if (!student) return res.status(404).json({ success: false, message: "Student record not found." });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching student form data:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getTermGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { yearLevel, semesterId } = req.query;

    const period = {};
    if (yearLevel !== undefined) {
      const yl = parseInt(yearLevel, 10);
      if (isNaN(yl) || yl < 1 || yl > 5) {
        return res.status(400).json({ success: false, message: `Invalid yearLevel: ${yearLevel}. Must be between 1 and 5.` });
      }
      period.yearLevel = yl;
    }
    if (semesterId !== undefined) {
      const sid = parseInt(semesterId, 10);
      if (isNaN(sid) || sid < 1 || sid > 3) {
        return res.status(400).json({ success: false, message: `Invalid semesterId: ${semesterId}. Must be between 1 and 3.` });
      }
      period.semesterId = sid;
    }

    const termGrade = await DocumentModel.getTermGradeData(id, period);
    if (!termGrade) {
      return res.status(404).json({
        success: false,
        message: "No enrollment record found for this student/period, so a term grade document could not be built."
      });
    }
    res.status(200).json({ success: true, data: termGrade });
  } catch (error) {
    console.error('Error in getTermGradeById:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

exports.getStudentFormMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentRes = await db.query(`SELECT student_id FROM students WHERE user_id = $1`, [userId]);

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const student = await DocumentModel.getStudentFormData(studentRes.rows[0].student_id);
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching student self record:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getCourseOutlineById = async (req, res) => {
  try {
    const { id } = req.params;
    const outline = await DocumentModel.getCourseOutlineDataByStudent(id, req.user);
    if (!outline) {
      return res.status(404).json({
        success: false,
        message: 'No curriculum found for this student, so a course outline could not be built.',
      });
    }
    res.status(200).json({ success: true, data: outline });
  } catch (error) {
    console.error('Error fetching student course outline:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};