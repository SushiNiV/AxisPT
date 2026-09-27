const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const AdminModel = require('../models/adminModel');
const UserModel = require('../models/userModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// AUTHENTICATION & USER MANAGEMENT
// ==========================================

exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await AdminModel.findByUsername(username);

    if (!admin) {
      await HistoryModel.log({
        userId: null, targetUserId: null, tableName: 'users', recordId: null,
        action: 'Login Failed', oldValues: null,
        newValues: { username, reason: 'User not found', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(404).json({ success: false, message: "Access denied. Invalid credentials." });
    }

    const rolesArray = Array.isArray(admin.roles)
      ? admin.roles
      : (typeof admin.roles === 'string' ? admin.roles.split(',') : []);

    const hasAdminRole = rolesArray.some(role =>
      ['SUPERADMIN', 'ADMIN'].includes(role.trim().toUpperCase())
    );

    if (!admin.is_active) {
      await HistoryModel.log({
        userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
        action: 'Login Failed', oldValues: null,
        newValues: { username, reason: 'Account deactivated', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(401).json({ success: false, message: "Account is deactivated. Please contact administrator." });
    }

    if (!hasAdminRole && !admin.faculty_status) {
      await HistoryModel.log({
        userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
        action: 'Login Failed', oldValues: null,
        newValues: { username, reason: 'No active faculty record', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(401).json({ success: false, message: "Access denied. Faculty account not active." });
    }

    const isBcrypt = admin.password_hash && (admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2a$'));
    const isMatch = isBcrypt ? await bcrypt.compare(password, admin.password_hash) : (password === admin.password_hash);

    if (!isMatch) {
      await HistoryModel.log({
        userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
        action: 'Login Failed', oldValues: null,
        newValues: { username, reason: 'Invalid password', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { id: admin.user_id, role: admin.roles, designation: admin.designation_name, faculty_id: admin.faculty_id },
      process.env.JWT_SECRET, { expiresIn }
    );

    await AdminModel.updateLastLogin(admin.user_id);

    await HistoryModel.log({
      userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
      action: 'Login Success', oldValues: null,
      newValues: {
        username: admin.username, role: admin.roles, designation: admin.designation_name,
        rememberMe, timestamp: new Date().toISOString()
      },
      ipAddress, userAgent
    });

    res.json({
      success: true, token, employeeID: admin.username, firstName: admin.first_name,
      role: admin.roles, designation: admin.designation_name,
      mustChangePassword: admin.changed_pass === false
    });

  } catch (err) {
    console.error("Login error:", err);
    try {
      await HistoryModel.log({
        userId: null, targetUserId: null, tableName: 'users', recordId: null,
        action: 'Login Error', oldValues: null,
        newValues: { username, error: err.message, timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
    } catch (historyErr) {
      console.error("Failed to log login error:", historyErr);
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await AdminModel.findById(userId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin user not found." });

    const isBcrypt = admin.password_hash && (admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2a$'));
    const isValid = isBcrypt ? await bcrypt.compare(currentPassword, admin.password_hash) : (currentPassword === admin.password_hash);

    if (!isValid) {
      await HistoryModel.log({
        userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
        action: 'Password Change Failed', oldValues: null,
        newValues: { reason: 'Current password is incorrect', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await AdminModel.updatePassword(userId, hashedPassword);
    if (!updated) return res.status(500).json({ success: false, message: "Failed to update password." });

    await HistoryModel.log({
      userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
      action: 'Password Changed', oldValues: { changed_pass: admin.changed_pass },
      newValues: { password_changed: true, changed_pass: true, changed_at: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Password changed successfully. Please login again." });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await UserModel.getAllRoles();
    const filteredRoles = roles.filter(role => role.role_name.toUpperCase() !== 'STUDENT');
    res.json({ success: true, data: filteredRoles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getDesignations = async (req, res) => {
  try {
    const designations = await UserModel.getAllDesignations();
    res.json({ success: true, data: designations });
  } catch (error) {
    console.error("Error fetching designations:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addUser = async (req, res) => {
  const { last_name, first_name, middle_name, suffix, username, email, role_id, designation_id, new_designation_name, is_active } = req.body;
  const client = db.getClient ? await db.getClient() : db;

  try {
    if (db.getClient) await client.query('BEGIN');

    let finalDesignationId = designation_id;

    if (new_designation_name) {
      const newDesignation = await client.query(`
        INSERT INTO designations (designation_name)
        VALUES ($1)
        ON CONFLICT (designation_name) DO NOTHING
        RETURNING designation_id
      `, [new_designation_name]);

      if (newDesignation.rows.length > 0) {
        finalDesignationId = newDesignation.rows[0].designation_id;
      } else {
        const existingDesignation = await client.query(`
          SELECT designation_id FROM designations WHERE designation_name = $1
        `, [new_designation_name]);
        finalDesignationId = existingDesignation.rows[0]?.designation_id;
      }
    }

    const plainPassword = `axis-cpt-${last_name.toLowerCase()}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userResult = await client.query(`
      INSERT INTO users (username, password_hash, school_email, is_active, changed_pass)
      VALUES ($1, $2, $3, $4, false)
      RETURNING user_id
    `, [username, hashedPassword, email, is_active]);

    const newUserId = userResult.rows[0].user_id;

    await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [newUserId, role_id]);

    await client.query(`
      INSERT INTO faculties (user_id, last_name, first_name, middle_name, suffix, designation, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [newUserId, last_name, first_name, middle_name || null, suffix || null, finalDesignationId, is_active]);

    if (db.getClient) await client.query('COMMIT');

    res.json({ success: true, message: "User created successfully", password: plainPassword });

  } catch (error) {
    if (db.getClient) await client.query('ROLLBACK');
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (db.getClient && client.release) client.release();
  }
};