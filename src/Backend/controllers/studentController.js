const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const studentModel = require('../models/studentModel');

//registration
const registerStudent = async (req, res) => {
  try {
    const formData = req.body;

    const surname = formData.lastName.toLowerCase().trim();
    const plainPassword = `axis-cpt-${surname}`;

    await studentModel.createFullProfile(formData, plainPassword);

    res.status(200).json({ success: true, message: "Registration submitted for admin review!" });
  } catch (error) {
    console.error("Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Database error during registration" });
  }
};

module.exports = { registerStudent };