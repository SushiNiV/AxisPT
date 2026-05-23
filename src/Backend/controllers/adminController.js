const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');
const ProgramModel = require('../models/programModel');
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
        message: "Access denied. Invalid credentials." 
      });
    }

    const hasAdminRole = admin.roles && (admin.roles.includes('SUPERADMIN') || admin.roles.includes('ADMIN'));
    
    if (!admin.is_active) {
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

    if (!hasAdminRole && !admin.faculty_status) {
      await HistoryModel.log({
        userId: admin.user_id,
        targetUserId: admin.user_id,
        tableName: 'users',
        recordId: admin.user_id,
        action: 'Login Failed',
        oldValues: null,
        newValues: { 
          username, 
          reason: 'No faculty record',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(401).json({ 
        success: false, 
        message: "Access denied. Faculty account not active." 
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

exports.addProgram = async (req, res) => {
  const { program_name, program_abbr, total_year, program_description, program_status } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    if (!program_name || !program_abbr || !total_year) {
      return res.status(400).json({ 
        success: false, 
        message: "Program name, abbreviation, and total years are required." 
      });
    }

    const existingPrograms = await ProgramModel.getAll();
    const existing = existingPrograms.find(p => p.program_abbr === program_abbr);

    if (existing) {
      await HistoryModel.log({
        userId: userId,
        targetUserId: userId,
        tableName: 'programs',
        recordId: null,
        action: 'PROGRAM_CREATE_FAILED',
        oldValues: null,
        newValues: { 
          program_name, 
          program_abbr, 
          reason: 'Program abbreviation already exists',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(400).json({ 
        success: false, 
        message: "Program abbreviation already exists." 
      });
    }

    const newProgram = await ProgramModel.create({
      program_name,
      program_abbr,
      total_year,
      program_description: program_description || null,
      program_status
    });

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'programs',
      recordId: newProgram.program_id,
      action: 'PROGRAM_CREATED',
      oldValues: null,
      newValues: {
        program_id: newProgram.program_id,
        program_name: newProgram.program_name,
        program_abbr: newProgram.program_abbr,
        total_year: newProgram.total_year,
        program_status: newProgram.program_status,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Program created successfully.",
      data: newProgram
    });

  } catch (error) {
    console.error("Error creating program:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'programs',
      recordId: null,
      action: 'PROGRAM_CREATE_ERROR',
      oldValues: null,
      newValues: {
        program_name,
        program_abbr,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const programs = await ProgramModel.getAll();
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getHistory = async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const history = await HistoryModel.getHistoryLogs({ 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    
    const formattedHistory = history.map(item => {
      let formattedAction = item.action;
      
      switch(item.action) {
        case 'LOGIN_SUCCESS':
          formattedAction = 'Login Success';
          break;
        case 'LOGIN_FAILED':
          formattedAction = 'Login Failed';
          break;
        case 'BULK_ACCEPT':
          formattedAction = 'Bulk Accept';
          break;
        case 'BULK_REJECT':
          formattedAction = 'Bulk Reject';
          break;
        case 'PASSWORD_CHANGED':
          formattedAction = 'Password Changed';
          break;
        case 'PASSWORD_CHANGE_FAILED':
          formattedAction = 'Password Change Failed';
          break;
        case 'PROGRAM_CREATED':
          formattedAction = 'Program Created';
          break;
        case 'PROGRAM_CREATE_FAILED':
          formattedAction = 'Program Creation Failed';
          break;
        case 'PROGRAM_CREATE_ERROR':
          formattedAction = 'Program Creation Error';
          break;
        default:
          formattedAction = item.action.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
      }
      
      let displayName = '';
      if (item.first_name && item.last_name) {
        displayName = `${item.first_name} ${item.last_name}`;
      } else if (item.user_name) {
        displayName = item.user_name;
      } else {
        displayName = 'System';
      }
      
      let formattedDetails = '';
      
      if (item.new_values && typeof item.new_values === 'object') {
        const newValues = item.new_values;
        
        switch(item.action) {
          case 'LOGIN_SUCCESS':
            formattedDetails = `${displayName} logged in successfully`;
            if (newValues.designation) {
              formattedDetails += ` as ${newValues.designation}`;
            }
            break;
            
          case 'LOGIN_FAILED':
            const reason = newValues.reason || 'Invalid credentials';
            formattedDetails = `${displayName} failed to login`;
            if (reason) {
              formattedDetails += ` - ${reason}`;
            }
            break;
            
          case 'PASSWORD_CHANGED':
            formattedDetails = `${displayName} changed their password`;
            if (newValues.changed_at) {
              formattedDetails += ` on ${new Date(newValues.changed_at).toLocaleString()}`;
            }
            break;
            
          case 'PASSWORD_CHANGE_FAILED':
            const failReason = newValues.reason || 'Unknown error';
            formattedDetails = `${displayName} failed to change password`;
            if (failReason) {
              formattedDetails += ` - ${failReason}`;
            }
            break;
            
          case 'BULK_ACCEPT':
            formattedDetails = `${displayName} bulk accepted requests`;
            if (newValues.count) {
              formattedDetails += ` (${newValues.count} items)`;
            }
            break;
            
          case 'BULK_REJECT':
            formattedDetails = `${displayName} bulk rejected requests`;
            if (newValues.count) {
              formattedDetails += ` (${newValues.count} items)`;
            }
            break;
            
          case 'PROGRAM_CREATED':
            formattedDetails = `${displayName} created program: ${newValues.program_name} (${newValues.program_abbr}) with ${newValues.total_year} year(s)`;
            break;
            
          case 'PROGRAM_CREATE_FAILED':
            formattedDetails = `${displayName} failed to create program ${newValues.program_abbr || newValues.program_name} - ${newValues.reason}`;
            break;
            
          case 'PROGRAM_CREATE_ERROR':
            formattedDetails = `Error creating program: ${newValues.error}`;
            break;
            
          default:
            formattedDetails = newValues.details || 
                              newValues.reason || 
                              `${displayName} performed ${formattedAction}`;
        }
      } 
      else if (item.old_values && typeof item.old_values === 'object') {
        const oldValues = item.old_values;
        formattedDetails = oldValues.details || 
                          oldValues.reason || 
                          `${displayName} performed ${formattedAction}`;
      } 
      else {
        formattedDetails = `${displayName} performed ${formattedAction}`;
      }
      
      formattedDetails = formattedDetails
        .replace(/[{}"]/g, '')
        .replace(/timestamp:/g, 'at')
        .replace(/rememberMe:/g, '')
        .replace(/false/g, '')
        .replace(/true/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      let designation = item.designation_name;
      if (!designation || designation === 'Unknown') {
        if (item.roles && item.roles.includes('SUPERADMIN')) {
          designation = 'Developer';
        } else if (item.roles && item.roles.includes('ADMIN')) {
          designation = 'Admin';
        } else {
          designation = 'Unknown';
        }
      }
      
      return {
        log_id: item.id,
        user_id: item.user_id,
        username: displayName,
        designation: designation,
        action: formattedAction,
        target_id: item.target_user_id,
        target_username: item.target_user_name || 'System',
        details: formattedDetails,
        timestamp: new Date(item.created_at).toLocaleString()
      };
    });
    
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