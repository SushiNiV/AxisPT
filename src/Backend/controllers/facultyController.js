const FacultyModel = require('../models/facultyModel');

// ==========================================
// FACULTY
// ==========================================

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await FacultyModel.getAll();
    res.json({ success: true, data: faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};