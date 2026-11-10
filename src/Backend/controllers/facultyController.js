const FacultyModel = require('../models/facultyModel');
const UserModel = require('../models/userModel');
const { hashPassword } = require('../services/authService');
const { withTransaction } = require('../../utils/transaction');
const { audit } = require('../../utils/audit');
const { parseId } = require('../../utils/request');
const HttpError = require('../../utils/httpError');

/**
 * Staff accounts (admin + faculty): one users row + one faculties row.
 * Replaces facultyController and the /users handlers that lived in authController.
 * In every route, :id is the USER id.
 */

const UNIQUE_VIOLATION = '23505';
const toHttpError = (err) =>
  err.code === UNIQUE_VIOLATION ? new HttpError(400, 'Username or email already exists.') : err;

const snapshot = (f) =>
  f && {
    user_id: f.user_id,
    last_name: f.last_name,
    first_name: f.first_name,
    designation_id: f.designation_id ?? f.designation,
    is_active: f.is_active ?? f.account_status,
  };

// undefined => "not provided" (leave unchanged); null/'' => clear it.
async function resolveDesignationId({ designation_id, new_designation_name }, client) {
  if (designation_id) return designation_id;
  const name = typeof new_designation_name === 'string' ? new_designation_name.trim() : '';
  if (name) return UserModel.findOrCreateDesignation(name, client);
  return designation_id === '' ? null : designation_id;
}

// ------------------------------------------------------------------- reads
exports.list = async (req, res) => {
  // Deactivated staff are only visible to admins (this route is also open to faculty).
  const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'admin';
  res.json({ success: true, data: await FacultyModel.getAll(includeInactive) });
};

exports.getById = async (req, res) => {
  const staff = await FacultyModel.getByUserId(parseId(req.params.id));
  if (!staff) throw new HttpError(404, 'User not found.');
  res.json({ success: true, data: staff });
};

exports.roles = async (req, res) => {
  res.json({ success: true, data: await UserModel.getAllRoles() });
};

exports.designations = async (req, res) => {
  res.json({ success: true, data: await UserModel.getAllDesignations() });
};

// ------------------------------------------------------------------ create
exports.create = async (req, res) => {
  const {
    last_name, first_name, middle_name, suffix, username, email,
    role_id, designation_id, new_designation_name, is_active = true,
  } = req.body ?? {};

  if (!last_name || !first_name || !username || !email || !role_id) {
    throw new HttpError(400, 'Last name, first name, username, email, and role are required.');
  }

  const active = Boolean(is_active);
  const plainPassword = `axis-cpt-${String(last_name).toLowerCase()}`;
  const passwordHash = await hashPassword(plainPassword);

  let faculty;
  try {
    faculty = await withTransaction(async (client) => {
      const userId = await UserModel.createAccount({ username, passwordHash, email, isActive: active }, client);
      await UserModel.setRole(userId, role_id, client);
      const designationId = await resolveDesignationId({ designation_id, new_designation_name }, client);
      return FacultyModel.create({
        user_id: userId, last_name, first_name,
        middle_name: middle_name || null, suffix: suffix || null,
        designation_id: designationId ?? null, account_status: active,
      }, client);
    });
  } catch (err) {
    throw toHttpError(err);
  }

  await audit(req, {
    targetUserId: faculty.user_id, tableName: 'faculties', recordId: faculty.faculty_id,
    action: 'FACULTY_CREATED', oldValues: null,
    newValues: { ...snapshot(faculty), timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'User created successfully', password: plainPassword, data: faculty });
};

// ------------------------------------------------------------------ update
exports.update = async (req, res) => {
  const userId = parseId(req.params.id);
  const {
    last_name, first_name, middle_name, suffix, username, email,
    role_id, designation_id, new_designation_name, is_active,
  } = req.body ?? {};

  const before = await FacultyModel.getByUserId(userId);
  if (!before) throw new HttpError(404, 'User not found.');

  let updated;
  try {
    updated = await withTransaction(async (client) => {
      await UserModel.updateAccount(userId, { username, email, isActive: is_active }, client);
      if (role_id) await UserModel.setRole(userId, role_id, client);
      const designationId = await resolveDesignationId({ designation_id, new_designation_name }, client);
      return FacultyModel.updateByUserId(userId, {
        last_name, first_name, middle_name, suffix,
        designation_id: designationId,
        account_status: typeof is_active === 'boolean' ? is_active : undefined,
      }, client);
    });
  } catch (err) {
    throw toHttpError(err);
  }

  await audit(req, {
    targetUserId: userId, tableName: 'faculties', recordId: before.faculty_id,
    action: 'FACULTY_UPDATED',
    oldValues: snapshot(before),
    newValues: { ...snapshot(updated), timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'User updated successfully.', data: updated });
};

// -------------------------------------------------- deactivate / restore
exports.remove = async (req, res) => {
  const userId = parseId(req.params.id);
  const before = await FacultyModel.getByUserId(userId);
  if (!before) throw new HttpError(404, 'User not found.');

  const data = await FacultyModel.deleteByUserId(userId);

  await audit(req, {
    targetUserId: userId, tableName: 'faculties', recordId: before.faculty_id,
    action: 'FACULTY_DELETED',
    oldValues: snapshot(before),
    newValues: { is_active: false, timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'User deleted successfully.', data });
};

exports.restore = async (req, res) => {
  const userId = parseId(req.params.id);
  const before = await FacultyModel.getByUserId(userId);
  if (!before) throw new HttpError(404, 'User not found.');

  await FacultyModel.restoreByUserId(userId);

  await audit(req, {
    targetUserId: userId, tableName: 'faculties', recordId: before.faculty_id,
    action: 'FACULTY_RESTORED',
    oldValues: { is_active: false },
    newValues: { is_active: true, timestamp: new Date().toISOString() },
  });

  res.json({ success: true, message: 'User restored successfully.' });
};