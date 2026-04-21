const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const saltRounds = 10;

exports.login = async (req, res) => {
  const { employeeID, password, rememberMe } = req.body;

  try {
    const user = await Admin.findById(employeeID);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    const isMatch = isBcrypt 
      ? await bcrypt.compare(password, user.password_hash) 
      : (password === user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { id: user.employee_id, role: user.role, designation: user.designation },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    await Admin.logLoginAction(user, `Successful login as ${user.designation}`);

    res.json({
      success: true,
      token,
      employeeID: user.employee_id,
      firstName: user.firstname,
      role: user.role,
      designation: user.designation,
      mustChangePassword: user.must_change_password
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  const { employeeID, currentPassword, newPassword } = req.body;

  try {
    const user = await Admin.findById(employeeID);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let isMatch = false;
    if (user.must_change_password) {
      isMatch = (currentPassword === user.password_hash);
    } else {
      isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await Admin.updatePassword(employeeID, hashedNewPassword);

    await Admin.logAction(
      user, 
      'PASSWORD_CHANGE', 
      `${user.designation} updated their own password.`
    );

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPendingStudents = async (req, res) => {
  try {
    const students = await Admin.getPending();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pending students" });
  }
};