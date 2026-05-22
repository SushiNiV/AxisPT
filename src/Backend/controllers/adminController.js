const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');
const HistoryModel = require('../models/historyModel');

exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await AdminModel.findByUsername(username);
    
    if (!admin) {
      await HistoryModel.log({
        userId: null,
        targetUserId: null,
        tableName: 'users',
        recordId: null,
        action: 'Login Failed',
        oldValues: null,
        newValues: { 
          username, 
          reason: 'User not found',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(404).json({ 
        success: false, 
        message: "Access denied. Only SuperAdmin and Admin roles can login." 
      });
    }

    if (!admin.is_active || !admin.faculty_status) {
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Login Failed',
        oldValues: null,
        newValues: { 
          username, 
          reason: 'Account deactivated',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

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
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Login Failed',
        oldValues: null,
        newValues: { 
          username, 
          reason: 'Invalid password',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

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

    await HistoryModel.log({
      userId: admin.user_id,
      targetUserId: admin.user_id,
      tableName: 'users',
      recordId: admin.user_id,
      action: 'Login Success',
      oldValues: null,
      newValues: { 
        username: admin.username,
        role: admin.roles,
        designation: admin.designation_name,
        rememberMe,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

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
    
    try {
      await HistoryModel.log({
        userId: null,
        targetUserId: null,
        tableName: 'users',
        recordId: null,
        action: 'Login Error',
        oldValues: null,
        newValues: { 
          username, 
          error: err.message,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });
    } catch (historyErr) {
      console.error("Failed to log error:", historyErr);
    }

    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await AdminModel.findById(userId);
    
    if (!admin) {
      await HistoryModel.log({
        userId: userId,
        targetUserId: userId,
        tableName: 'users',
        recordId: userId,
        action: 'Password Change Failed',
        oldValues: null,
        newValues: { 
          reason: 'Admin not found',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

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
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Password Change Failed',
        oldValues: null,
        newValues: { 
          reason: 'Current password is incorrect',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    if (newPassword.length < 8) {
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Password Change Failed',
        oldValues: null,
        newValues: { 
          reason: 'New password too weak (min 8 characters)',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 8 characters long" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const oldValues = {
      password_changed_at: admin.updated_at,
      changed_pass: admin.changed_pass,
      timestamp: new Date().toISOString()
    };
    
    const updated = await AdminModel.updatePassword(userId, hashedPassword);
    
    if (!updated) {
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Password Change Failed',
        oldValues: null,
        newValues: { 
          reason: 'Database update failed',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(500).json({ 
        success: false, 
        message: "Failed to update password" 
      });
    }

    await HistoryModel.log({
      userId: admin.user_id,
      targetUserId: admin.user_id,
      tableName: 'users',
      recordId: admin.user_id,
      action: 'Password Changed',
      oldValues: oldValues,
      newValues: { 
        password_changed: true,
        changed_pass: true,
        changed_at: new Date().toISOString(),
        ip: ipAddress
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Password changed successfully. Please login again." 
    });

  } catch (err) {
    console.error("Change password error:", err);
    
    try {
      await HistoryModel.log({
        userId: userId,
        targetUserId: userId,
        tableName: 'users',
        recordId: userId,
        action: 'Password Change Error',
        oldValues: null,
        newValues: { 
          error: err.message,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });
    } catch (historyErr) {
      console.error("Failed to log error:", historyErr);
    }

    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

exports.getHistory = async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const history = await HistoryModel.getHistoryLogs({ 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    const formattedHistory = history.map(item => ({
      log_id: item.id,
      user_id: item.user_id,
      user_role: item.user_name || 'System',
      action: item.action,
      target_id: item.target_user_id,
      details: item.new_values?.details || item.new_values?.reason || JSON.stringify(item.new_values),
      timestamp: item.created_at
    }));
    
    res.json({ 
      success: true, 
      history: formattedHistory 
    });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};

exports.extractDetails = (item) => {
  if (item.new_values?.details) return item.new_values.details;
  if (item.new_values?.reason) return item.new_values.reason;
  if (item.action === 'Login Success') return `Logged in as ${item.user_name}`;
  if (item.action === 'Login Failed') return `Failed login attempt - ${item.new_values?.reason || 'Unknown reason'}`;
  if (item.action === 'Password Changed') return 'Password was changed successfully';
  if (item.action === 'Password Change Failed') return `Password change failed - ${item.new_values?.reason || 'Unknown error'}`;
  return 'Action performed';
};