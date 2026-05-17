const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');

exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  try {
    const admin = await AdminModel.findByUsername(username);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Access denied. Only SuperAdmin and Admin roles can login." 
      });
    }

    if (!admin.is_active || !admin.faculty_status) {
      return res.status(401).json({ 
        success: false, 
        message: "Account is deactivated. Please contact administrator." 
      });
    }

    const isBcrypt = admin.password_hash && 
                     (admin.password_hash.startsWith('$2b$') || 
                      admin.password_hash.startsWith('$2a$'));
    
    let isMatch;
    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, admin.password_hash);
    } else {
      isMatch = (password === admin.password_hash);
    }
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { 
        id: admin.user_id, 
        role: admin.roles, 
        designation: admin.designation_name,
        faculty_id: admin.faculty_id
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    await AdminModel.updateLastLogin(admin.user_id);

    res.json({ 
      success: true, 
      token, 
      employeeID: admin.username,
      firstName: admin.first_name,
      role: admin.roles,
      designation: admin.designation_name,
      mustChangePassword: admin.changed_pass === false
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const admin = await AdminModel.findById(userId);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin not found" 
      });
    }

    const isBcrypt = admin.password_hash && 
                     (admin.password_hash.startsWith('$2b$') || 
                      admin.password_hash.startsWith('$2a$'));
    
    let isValid;
    if (isBcrypt) {
      isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    } else {
      isValid = (currentPassword === admin.password_hash);
    }

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updated = await AdminModel.updatePassword(userId, hashedPassword);
    
    if (!updated) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update password" 
      });
    }

    res.json({ 
      success: true, 
      message: "Password changed successfully. Please login again." 
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};