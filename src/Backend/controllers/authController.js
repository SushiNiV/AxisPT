const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');

const AdminModel = require('../models/adminModel');
const UserModel = require('../models/userModel');
const HistoryModel = require('../models/historyModel');

// Initialize Google Client for verifying tokens
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// AUTHENTICATION & USER MANAGEMENT
// ==========================================
exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const safeLog = async (payload) => {
    try { await HistoryModel.log(payload); } catch (e) { console.error('Log failed:', e.message); }
  };

  try {
    // 1. Check if this is a student
    const student = await db.query(`
      SELECT s.student_id, s.user_id, s.birth_date, s.account_status,
             u.username, u.password_hash, u.is_active, u.changed_pass,
             p.first_name, p.last_name
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN student_pii p ON p.student_id = s.student_id
      WHERE u.username = $1
      LIMIT 1
    `, [username]);

    if (student.rows.length > 0) {
      const s = student.rows[0];

      const isBcrypt = s.password_hash &&
        (s.password_hash.startsWith('$2b$') || s.password_hash.startsWith('$2a$'));
      const isMatch = isBcrypt
        ? await bcrypt.compare(password, s.password_hash)
        : (password === s.password_hash);

      if (!isMatch || !s.is_active) {
        return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
      }

      // Student birthday confirmation check (optional second factor)
      const { birthday } = req.body;
      if (birthday && s.birth_date) {
        const dbDate = new Date(s.birth_date).toISOString().split('T')[0];
        if (dbDate !== birthday) {
          return res.status(401).json({ success: false, message: 'Birthday does not match our records.' });
        }
      }

      const wantsRemember = rememberMe === true || rememberMe === 'true';
      const token = jwt.sign(
        { id: s.user_id, student_id: s.student_id, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: wantsRemember ? '7d' : '2h' }
      );

      return res.json({
        success: true,
        token,
        username: s.username,
        firstName: s.first_name,
        role: 'student',
        mustChangePassword: s.changed_pass === false,
      });
    }

    // 2. Otherwise fall through to admin/faculty login (existing logic)
    const admin = await AdminModel.findByUsername(username);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
    }

    const isBcrypt = admin.password_hash &&
      (admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2a$'));
    const isMatch = isBcrypt
      ? await bcrypt.compare(password, admin.password_hash)
      : (password === admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
    }

    const rolesArray = Array.isArray(admin.roles)
      ? admin.roles
      : (typeof admin.roles === 'string' ? admin.roles.split(',') : []);

    const hasAdminRole = rolesArray.some(r =>
      ['SUPERADMIN', 'ADMIN'].includes(r.trim().toUpperCase())
    );

    if (!admin.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    if (!hasAdminRole && !admin.faculty_status) {
      return res.status(403).json({ success: false, message: 'Access denied. Faculty account not active.' });
    }

    const wantsRemember = rememberMe === true || rememberMe === 'true';
    const token = jwt.sign(
      {
        id: admin.user_id,
        role: hasAdminRole ? 'admin' : 'faculty',
        designation: admin.designation_name,
        faculty_id: admin.faculty_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: wantsRemember ? '7d' : '2h' }
    );

    await AdminModel.updateLastLogin(admin.user_id);

    res.json({
      success: true,
      token,
      username: admin.username,
      firstName: admin.first_name,
      role: hasAdminRole ? 'admin' : 'faculty',
      designation: admin.designation_name,
      mustChangePassword: admin.changed_pass === false,
      email: admin.school_email || '—', 
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==========================================
// GOOGLE OAUTH LOGIN
// ==========================================
exports.googleLogin = async (req, res) => {
  const { token } = req.body; // The access_token from the React frontend
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const safeLog = async (payload) => {
    try { await HistoryModel.log(payload); } catch (e) { console.error('Log failed:', e.message); }
  };

  try {
    if (!token) {
      return res.status(400).json({ success: false, message: 'No Google token provided.' });
    }

    // 1. Verify the token with Google
    const ticket = await googleClient.getTokenInfo(token);
    const email = ticket.email ? ticket.email.toLowerCase() : '';

    // 2. Domain check (just in case)
    if (!email.endsWith('@fatima.edu.ph') && !email.endsWith('@student.fatima.edu.ph')) {
      return res.status(403).json({ success: false, message: 'Please use your official Fatima email.' });
    }

    // 3. Check if this email belongs to a Student
    // We query the `users` table where the `school_email` matches the Google email
    const student = await db.query(`
      SELECT s.student_id, s.user_id, s.account_status,
             u.username, u.is_active, u.changed_pass,
             p.first_name, p.last_name
      FROM users u
      JOIN students s ON u.user_id = s.user_id
      LEFT JOIN student_pii p ON p.student_id = s.student_id
      WHERE LOWER(u.school_email) = $1
      LIMIT 1
    `, [email]);

    if (student.rows.length > 0) {
      const s = student.rows[0];

      if (!s.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
      }

      // Generate JWT exactly like your normal login
      const jwtToken = jwt.sign(
        { id: s.user_id, student_id: s.student_id, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      await safeLog({
        userId: s.user_id, action: 'Google Login', tableName: 'users', recordId: s.user_id,
        ipAddress, userAgent
      });

      return res.json({
        success: true,
        token: jwtToken,
        username: s.username,
        firstName: s.first_name,
        role: 'student',
        mustChangePassword: false, // Bypassed for Google Auth
      });
    }

    // 4. If not a student, check if it's an Admin/Faculty
    const adminRes = await db.query(`
      SELECT u.user_id, u.username, u.changed_pass, u.is_active, u.school_email,
             f.faculty_id, f.first_name, f.faculty_status, d.designation_name,
             (SELECT string_agg(r.role_name, ',') FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id WHERE ur.user_id = u.user_id) as roles
      FROM users u
      LEFT JOIN faculties f ON f.user_id = u.user_id
      LEFT JOIN designations d ON d.designation_id = f.designation
      WHERE LOWER(u.school_email) = $1
      LIMIT 1
    `, [email]);

    if (adminRes.rows.length > 0) {
      const admin = adminRes.rows[0];
      
      const rolesArray = admin.roles ? admin.roles.split(',') : [];
      const hasAdminRole = rolesArray.some(r => ['SUPERADMIN', 'ADMIN'].includes(r.trim().toUpperCase()));

      if (!admin.is_active || (!hasAdminRole && !admin.faculty_status)) {
        return res.status(403).json({ success: false, message: 'Access denied. Account not active.' });
      }

      const jwtToken = jwt.sign(
        {
          id: admin.user_id,
          role: hasAdminRole ? 'admin' : 'faculty',
          designation: admin.designation_name,
          faculty_id: admin.faculty_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      await safeLog({
        userId: admin.user_id, action: 'Google Login', tableName: 'users', recordId: admin.user_id,
        ipAddress, userAgent
      });

      return res.json({
        success: true,
        token: jwtToken,
        username: admin.username,
        firstName: admin.first_name,
        role: hasAdminRole ? 'admin' : 'faculty',
        designation: admin.designation_name,
        mustChangePassword: false,
        email: admin.school_email,
      });
    }

    // 5. If we reach here, they have a valid Fatima email but aren't in the database.
    return res.status(404).json({ 
      success: false, 
      message: 'Your email is not registered in the portal. Please contact the administrator.' 
    });

  } catch (err) {
    console.error('Google Login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error during Google login.' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await AdminModel.findById(userId);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin user not found.' });

    const isBcrypt = admin.password_hash &&
      (admin.password_hash.startsWith('$2b$') || admin.password_hash.startsWith('$2a$'));
    const isValid = isBcrypt
      ? await bcrypt.compare(currentPassword, admin.password_hash)
      : (currentPassword === admin.password_hash);

    if (!isValid) {
      await HistoryModel.log({
        userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
        action: 'Password Change Failed', oldValues: null,
        newValues: { reason: 'Current password is incorrect', timestamp: new Date().toISOString() },
        ipAddress, userAgent
      });
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await AdminModel.updatePassword(userId, hashedPassword);
    if (!updated) return res.status(500).json({ success: false, message: 'Failed to update password.' });

    await HistoryModel.log({
      userId: admin.user_id, targetUserId: admin.user_id, tableName: 'users', recordId: admin.user_id,
      action: 'Password Changed', oldValues: { changed_pass: admin.changed_pass },
      newValues: { password_changed: true, changed_pass: true, changed_at: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: 'Password changed successfully. Please login again.' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await UserModel.getAllRoles();
    const filteredRoles = roles.filter(role => role.role_name.toUpperCase() !== 'STUDENT');
    res.json({ success: true, data: filteredRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getDesignations = async (req, res) => {
  try {
    const designations = await UserModel.getAllDesignations();
    res.json({ success: true, data: designations });
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.addUser = async (req, res) => {
  const {
    last_name, first_name, middle_name, suffix,
    username, email,
    role_id, designation_id, new_designation_name,
    is_active,
  } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let finalDesignationId = designation_id || null;
    if (!finalDesignationId && new_designation_name) {
      const newDesignation = await client.query(`
        INSERT INTO designations (designation_name)
        VALUES ($1)
        ON CONFLICT (designation_name) DO UPDATE
          SET designation_name = EXCLUDED.designation_name
        RETURNING designation_id
      `, [new_designation_name]);
      finalDesignationId = newDesignation.rows[0].designation_id;
    }

    const safeLast = (last_name || 'user').toLowerCase();
    const plainPassword = `axis-cpt-${safeLast}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userResult = await client.query(`
      INSERT INTO users (username, password_hash, school_email, is_active, changed_pass)
      VALUES ($1, $2, $3, $4, false)
      RETURNING user_id
    `, [username, hashedPassword, email, Boolean(is_active)]);
    const newUserId = userResult.rows[0].user_id;

    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [newUserId, role_id]);

    await client.query(`
      INSERT INTO faculties (
        user_id, last_name, first_name, middle_name, suffix,
        designation, account_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      newUserId, last_name, first_name,
      middle_name || null, suffix || null,
      finalDesignationId, Boolean(is_active),
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User created successfully',
      password: plainPassword,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error.' });
  } finally {
    client.release();
  }
};