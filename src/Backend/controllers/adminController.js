const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const Admin = require('../models/adminModel');
const History = require('../models/historyModel');

exports.getHistory = async (req, res) => {
  try {
    const { id, role, designation } = req.user; 
    const isPowerUser = 
      designation?.toLowerCase() === 'superadmin' || 
      role?.toLowerCase() === 'developer';

    const history = await History.getHistory(id, isPowerUser);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};

exports.login = async (req, res) => {
  const { employeeID, password, rememberMe } = req.body;
  try {
    const user = await Admin.findById(employeeID);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    const isMatch = isBcrypt ? await bcrypt.compare(password, user.password_hash) : (password === user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { id: user.employee_id, role: user.role, designation: user.designation },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    await History.logTransaction({
      user_id: user.employee_id,
      user_role: user.role,
      user_designation: user.designation,
      action: 'LOGIN',
      target_id: user.employee_id,
      details: `Successful login as ${user.designation}`
    });

    res.json({ success: true, token, employeeID: user.employee_id, firstName: user.firstname, role: user.role, designation: user.designation, mustChangePassword: user.must_change_password });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.bulkAcceptStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    await Admin.acceptStudentsBulk(ids);

    await History.logTransaction({
      user_id: req.user.id,
      user_role: req.user.role,
      user_designation: req.user.designation,
      action: 'BULK_ACCEPT',
      target_id: ids.join(','),
      details: `Accepted ${ids.length} student applications.`
    });

    res.json({ success: true, message: "Students accepted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
};

exports.bulkRejectStudents = async (req, res) => {
  const { ids } = req.body;
  try {
    await Admin.rejectStudentsBulk(ids);

    await History.logTransaction({
      user_id: req.user.id,
      user_role: req.user.role,
      user_designation: req.user.designation,
      action: 'BULK_REJECT',
      target_id: ids.join(','),
      details: `Rejected ${ids.length} student applications.`
    });

    res.json({ success: true, message: `Successfully rejected ${ids.length} applications.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject students" });
  }
};

exports.changePassword = async (req, res) => {
  const { employeeID, currentPassword, newPassword } = req.body;
  try {
    const user = await Admin.findById(employeeID);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let isMatch = user.must_change_password ? (currentPassword === user.password_hash) : await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password incorrect" });

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await Admin.updatePassword(employeeID, hashedNewPassword);

    await History.logTransaction({
      user_id: user.employee_id,
      user_role: user.role,
      user_designation: user.designation,
      action: 'PASSWORD CHANGE',
      target_id: user.employee_id,
      details: `${user.designation} updated their own password.`
    });

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMasterlist = async (req, res) => {
  try {
    const students = await Admin.getMasterlist(); 
    res.json({ success: true, students }); 
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
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

// backend/controllers/adminController.js (or similar)
// adminController.js

exports.getStudentFormData = async (req, res) => {
    try {
        const { id } = req.params; 
        const studentData = await Admin.getStudentFullDetails(id);
        if (!studentData) {
            return res.status(404).json({ 
                success: false, 
                message: "Student record not found" 
            });
        }
        res.json({ 
            success: true, 
            data: studentData 
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error",
            details: error.message 
        });
    }
};

//program
exports.addProgram = async (req, res) => {
    try {
        const { name, abbreviation, total_years, description, status } = req.body;

        const user = req.user; 
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const newProgram = await Admin.createProgram({
            name, abbreviation, total_years, description, status
        });

        try {
            await History.logTransaction({
                user_id: user.id, 
                user_role: user.role,
                user_designation: user.designation,
                action: 'ADDED PROGRAM',
                target_id: user.id, 
                details: `${user.designation} added a program.`
            });
        } catch (historyError) {
            console.error("History logging failed:", historyError.message);
        }

        res.status(201).json({ 
            success: true, 
            message: "Program created successfully", 
            program: newProgram 
        });
    } catch (err) {
        console.error("Add Program Error:", err);
        res.status(500).json({ success: false, message: "Failed to create program" });
    }
};

exports.getPrograms = async (req, res) => {
    try {
        const programs = await Admin.getPrograms();
        res.json({ 
            success: true, 
            data: programs
        });
    } catch (err) {
        console.error("Get Programs Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching programs" 
        });
    }
};