const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const AuthModel = require('../models/authModel');
const HistoryModel = require('../models/historyModel');
const HttpError = require('../../utils/httpError');

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_TTL = { normal: '2h', remember: '7d' };
const ALLOWED_EMAIL_DOMAINS = ['fatima.edu.ph', 'student.fatima.edu.ph'];
const ADMIN_ROLE_NAMES = ['SUPERADMIN', 'ADMIN'];
const INVALID_LOGIN = 'Invalid Username or Password.';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------------------------------------------------------- passwords
const isBcryptHash = (h) => typeof h === 'string' && /^\$2[aby]\$/.test(h);

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * Replaces the `isBcrypt ? compare : plain === hash` snippet that was repeated
 * three times. A missing hash or missing password can never match (the old code
 * let `null === null` pass).
 * `legacy: true` means the stored value was plaintext and matched; the caller
 * should upgrade it to a bcrypt hash.
 */
async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || !plain || typeof hash !== 'string' || !hash) {
    return { ok: false, legacy: false };
  }
  if (isBcryptHash(hash)) {
    return { ok: await bcrypt.compare(plain, hash), legacy: false };
  }
  const ok = safeEqual(plain, hash); // legacy plaintext row
  return { ok, legacy: ok };
}

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

async function upgradeLegacyHash(userId, plain) {
  try {
    await AuthModel.rehashPassword(userId, await hashPassword(plain));
  } catch (err) {
    console.error('Legacy password upgrade failed:', err.message);
  }
}

// ------------------------------------------------------------------- tokens
const signToken = (payload, remember = false) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: remember ? TOKEN_TTL.remember : TOKEN_TTL.normal,
  });

const studentToken = (s, remember) =>
  signToken({ id: s.user_id, student_id: s.student_id, role: 'student' }, remember);

const staffToken = (a, role, remember) =>
  signToken(
    { id: a.user_id, role, designation: a.designation_name, faculty_id: a.faculty_id },
    remember
  );

// -------------------------------------------------------------------- roles
const parseRoles = (roles) => {
  if (Array.isArray(roles)) return roles;
  return typeof roles === 'string' ? roles.split(',') : [];
};

const staffRole = (staff) =>
  parseRoles(staff.roles).some((r) => ADMIN_ROLE_NAMES.includes(String(r).trim().toUpperCase()))
    ? 'admin'
    : 'faculty';

/**
 * THE single place that decides whether a staff account may sign in.
 * (Student rules live in loginWithPassword / loginWithGoogle.)
 */
function assertStaffActive(staff, role) {
  if (!staff.is_active) {
    throw new HttpError(403, 'Account is deactivated.');
  }
  if (role !== 'admin' && !staff.faculty_status) {
    throw new HttpError(403, 'Access denied. Faculty account not active.');
  }
}

// ---------------------------------------------------------------- responses
const studentResponse = (s, token, mustChangePassword) => ({
  success: true,
  token,
  username: s.username,
  firstName: s.first_name,
  role: 'student',
  mustChangePassword,
});

const staffResponse = (a, token, role, mustChangePassword) => ({
  success: true,
  token,
  username: a.username,
  firstName: a.first_name,
  role,
  designation: a.designation_name,
  mustChangePassword,
  email: a.school_email || '—',
});

const safeLog = async (entry) => {
  try {
    await HistoryModel.log(entry);
  } catch (err) {
    console.error('History log failed:', err.message);
  }
};

// ----------------------------------------------------------- password login
async function loginWithPassword({ username, password, rememberMe, birthday }) {
  if (typeof username !== 'string' || !username || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Username and password are required.');
  }
  const remember = rememberMe === true || rememberMe === 'true';

  // 1. Student?
  const student = await AuthModel.findStudentByUsername(username);
  if (student) {
    const { ok, legacy } = await verifyPassword(password, student.password_hash);
    if (!ok || !student.is_active) throw new HttpError(401, INVALID_LOGIN);

    // Optional second factor: only enforced when the client sends a birthday.
    if (birthday && student.birth_date && student.birth_date !== birthday) {
      throw new HttpError(401, 'Birthday does not match our records.');
    }

    if (legacy) await upgradeLegacyHash(student.user_id, password);
    return studentResponse(student, studentToken(student, remember), student.changed_pass === false);
  }

  // 2. Admin / faculty
  const staff = await AuthModel.findStaffByUsername(username);
  if (!staff) throw new HttpError(401, INVALID_LOGIN);

  const { ok, legacy } = await verifyPassword(password, staff.password_hash);
  if (!ok) throw new HttpError(401, INVALID_LOGIN);

  const role = staffRole(staff);
  assertStaffActive(staff, role);

  if (legacy) await upgradeLegacyHash(staff.user_id, password);
  await AuthModel.touchLastLogin(staff.user_id);

  return staffResponse(staff, staffToken(staff, role, remember), role, staff.changed_pass === false);
}

// ------------------------------------------------------------- google login
/** Verifies the Google access token and returns the lowercased, allowed email. */
async function verifyGoogleAccessToken(accessToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID is not set; refusing Google login.');
    throw new HttpError(503, 'Google login is not configured.');
  }

  let info;
  try {
    info = await googleClient.getTokenInfo(accessToken);
  } catch (err) {
    throw new HttpError(401, 'Invalid Google token.');
  }

  // Without this, a token Google issued to ANY other app would be accepted.
  if (info.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new HttpError(401, 'Google token was not issued for this application.');
  }
  if (String(info.email_verified) !== 'true') {
    throw new HttpError(403, 'Your Google email is not verified.');
  }

  const email = (info.email || '').toLowerCase();
  if (!ALLOWED_EMAIL_DOMAINS.some((d) => email.endsWith(`@${d}`))) {
    throw new HttpError(403, 'Please use your official Fatima email.');
  }
  return email;
}

async function loginWithGoogle({ accessToken, ctx = {} }) {
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new HttpError(400, 'No Google token provided.');
  }
  const email = await verifyGoogleAccessToken(accessToken);

  const logLogin = (userId) =>
    safeLog({ userId, action: 'Google Login', tableName: 'users', recordId: userId, ...ctx });

  const student = await AuthModel.findStudentByEmail(email);
  if (student) {
    if (!student.is_active) throw new HttpError(403, 'Account is deactivated.');
    await logLogin(student.user_id);
    return studentResponse(student, studentToken(student, false), false);
  }

  const staff = await AuthModel.findStaffByEmail(email);
  if (staff) {
    const role = staffRole(staff);
    assertStaffActive(staff, role);
    await logLogin(staff.user_id);
    return staffResponse(staff, staffToken(staff, role, false), role, false);
  }

  throw new HttpError(404, 'Your email is not registered in the portal. Please contact the administrator.');
}

// ---------------------------------------------------------- change password
async function changePassword({ userId, currentPassword, newPassword, ctx = {} }) {
  if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string') {
    throw new HttpError(400, 'Current and new password are required.');
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (newPassword === currentPassword) {
    throw new HttpError(400, 'New password must be different from the current password.');
  }

  const user = await AuthModel.findCredentialsById(userId);
  if (!user) throw new HttpError(404, 'User not found.');

  const { ok } = await verifyPassword(currentPassword, user.password_hash);
  const base = { userId: user.user_id, targetUserId: user.user_id, tableName: 'users', recordId: user.user_id, ...ctx };

  if (!ok) {
    await safeLog({
      ...base, action: 'Password Change Failed', oldValues: null,
      newValues: { reason: 'Current password is incorrect', timestamp: new Date().toISOString() },
    });
    throw new HttpError(401, 'Current password is incorrect.');
  }

  const updated = await AuthModel.updatePassword(userId, await hashPassword(newPassword));
  if (!updated) throw new HttpError(500, 'Failed to update password.');

  await safeLog({
    ...base, action: 'Password Changed',
    oldValues: { changed_pass: user.changed_pass },
    newValues: { password_changed: true, changed_pass: true, changed_at: new Date().toISOString() },
  });

  return { success: true, message: 'Password changed successfully. Please login again.' };
}

module.exports = { loginWithPassword, loginWithGoogle, changePassword, verifyPassword, hashPassword };