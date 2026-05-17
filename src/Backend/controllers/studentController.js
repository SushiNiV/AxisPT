const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const studentModel = require('../models/studentModel');
   

//registration
const registerStudent = async (req, res) => {
  try {
    const formData = req.body;

    // Check if student ID already exists
    const existing = await studentModel.findById(formData.studentID);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "exists",
        message: "This Student ID is already registered."
      });
    }

    // Generate password hash
    const bcrypt = require('bcrypt');
    const surname = (formData.lastName || '').toLowerCase().trim();
    const plainPassword = `axis-cpt-${surname}`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Add password hash to data
    const dataWithPassword = {
      ...formData,
      passwordHash
    };

    await studentModel.createFullProfile(dataWithPassword);

    res.status(200).json({
      success: true,
      message: "Registration submitted for admin review!"
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: "exists",
        message: "Duplicate record detected."
      });
    }
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Database error during registration"
    });
  }
};


const loginStudent = async (req, res) => {
  const { studentID, password, birthday, rememberMe } = req.body;

  console.log("--- LOGIN ATTEMPT START ---");
  console.log("Request Body ID:", studentID);
  try {
    const student = await studentModel.findById(studentID);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const dbDate = new Date(student.birth_date);
    const formattedDbBirthday = dbDate.toLocaleDateString('en-CA'); 

    console.log("DEBUG -> Frontend says:", birthday); 
    console.log("DEBUG -> DB says (Formatted):", formattedDbBirthday);

    if (formattedDbBirthday !== birthday) {
        return res.status(401).json({ success: false, message: `Birthdate mismatch. You sent: ${birthday}, but DB expects: ${formattedDbBirthday}` });
    }

    const isBcrypt = student.password_hash && (student.password_hash.startsWith('$2b$') || student.password_hash.startsWith('$2a$'));
    const isMatch = isBcrypt
      ? await bcrypt.compare(password, student.password_hash)
      : (password === student.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { id: student.student_id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      success: true,
      token,
      user: student.firstname || student.first_name || '',
      mustChangePassword: student.must_change_password
    });

  } catch (err) {
    console.error("STUDENT LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const changePassword = async (req, res) => {
  const { studentID, currentPassword, newPassword } = req.body;

  try {
    const student = await studentModel.findById(studentID);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    let isMatch = false;
    if (student.must_change_password) {
      isMatch = (currentPassword === student.password_hash);
    } else {
      isMatch = await bcrypt.compare(currentPassword, student.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password cannot be the same as the current one." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await studentModel.updatePassword(studentID, hashedNewPassword);

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerStudent, loginStudent, changePassword };