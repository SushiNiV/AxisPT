const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const studentModel = require('../models/studentModel');
const Admin = require('../models/adminModel');
const saltRounds = 10;

//registration
const registerStudent = async (req, res) => {
  try {
    const formData = req.body;

    const studentID = formData.studentID;
    const existing = await studentModel.findById(studentID);
    if (existing) {
      return res.status(409).json({
        success: false, 
        error: "exists", 
        message: "This Student ID is already registered." 
      });
    }

    const surname = formData.lastName.toLowerCase().trim();
    const plainPassword = `axis-cpt-${surname}`;

    await studentModel.createFullProfile(formData, plainPassword);

    res.status(200).json({ success: true, message: "Registration submitted for admin review!" });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        error: "exists", 
        message: "Duplicate record detected." 
      });
    }
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Database error during registration" });
  }
};

module.exports = { registerStudent };