const FacultyModel = require('../models/facultyModel');
const HistoryModel = require('../models/historyModel');
const db = require('../config/db');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// FACULTY
// ==========================================

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await FacultyModel.getAll();
    res.json({ success: true, data: faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await FacultyModel.getById(id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found." });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addFaculty = async (req, res) => {
  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const {
    last_name, first_name, middle_name, suffix,
    username, email,
    role_id, designation_id, new_designation_name,
    is_active = true,
  } = req.body;

  if (!last_name || !first_name || !username || !email || !role_id) {
    return res.status(400).json({
      success: false,
      message: 'Last name, first name, username, email, and role are required.',
    });
  }

  const client = db.getClient ? await db.getClient() : db;
  const isDedicatedClient = Boolean(db.getClient);

  try {
    if (isDedicatedClient) await client.query('BEGIN');

    // 1. Create user
    const userRes = await client.query(`
      INSERT INTO users (username, school_email, password_hash, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id
    `, [
      username,
      email,
      null,
      Boolean(is_active),
    ]);
    const newUserId = userRes.rows[0].user_id;

    // 2. Assign role
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [newUserId, role_id]);

    // 3. Resolve designation (existing or new)
    let finalDesignationId = designation_id;
    if (!finalDesignationId && new_designation_name) {
      const desRes = await client.query(`
        INSERT INTO designations (designation_name)
        VALUES ($1)
        ON CONFLICT (designation_name) DO UPDATE
          SET designation_name = EXCLUDED.designation_name
        RETURNING designation_id
      `, [new_designation_name]);
      finalDesignationId = desRes.rows[0].designation_id;
    }

    // 4. Create faculty row
    const faculty = await FacultyModel.create({
      user_id: newUserId,
      last_name,
      first_name,
      middle_name,
      suffix,
      designation_id: finalDesignationId,
      account_status: Boolean(is_active),
    });

    if (isDedicatedClient) await client.query('COMMIT');

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'faculties',
      recordId: faculty.faculty_id,
      action: 'FACULTY_CREATED', oldValues: null,
      newValues: {
        user_id: newUserId, last_name, first_name,
        designation_id: finalDesignationId, is_active,
        timestamp: new Date().toISOString(),
      },
      ipAddress, userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: faculty,
    });
  } catch (error) {
    if (isDedicatedClient) await client.query('ROLLBACK');
    console.error("Error creating faculty:", error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (isDedicatedClient && client.release) client.release();
  }
};

exports.updateFaculty = async (req, res) => {
  const { id: userId } = req.params;
  const userIdCaller = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const {
    last_name, first_name, middle_name, suffix,
    username, email,
    role_id, designation_id, new_designation_name,
    is_active,
  } = req.body;

  const client = db.getClient ? await db.getClient() : db;
  const isDedicatedClient = Boolean(db.getClient);

  try {
    if (isDedicatedClient) await client.query('BEGIN');

    // 1. Update users table
    await client.query(`
      UPDATE users
      SET
        username = COALESCE($1, username),
        school_email = COALESCE($2, school_email),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE user_id = $4
    `, [
      username || null,
      email || null,
      typeof is_active === 'boolean' ? is_active : null,
      userId,
    ]);

    // 2. Update role if provided
    if (role_id) {
      await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userId, role_id]);
    }

    // 3. Resolve designation
    let finalDesignationId = designation_id;
    if (!finalDesignationId && new_designation_name) {
      const desRes = await client.query(`
        INSERT INTO designations (designation_name)
        VALUES ($1)
        ON CONFLICT (designation_name) DO UPDATE
          SET designation_name = EXCLUDED.designation_name
        RETURNING designation_id
      `, [new_designation_name]);
      finalDesignationId = desRes.rows[0].designation_id;
    }

    // 4. Update faculty row
    const updatedFaculty = await FacultyModel.updateByUserId(userId, {
      last_name,
      first_name,
      middle_name,
      suffix,
      designation_id: finalDesignationId,
      account_status: typeof is_active === 'boolean' ? is_active : undefined,
    });

    if (isDedicatedClient) await client.query('COMMIT');

    await HistoryModel.log({
      userId: userIdCaller, targetUserId: userIdCaller, tableName: 'faculties',
      recordId: updatedFaculty?.faculty_id || null,
      action: 'FACULTY_UPDATED', oldValues: null,
      newValues: {
        user_id: Number(userId), last_name, first_name,
        designation_id: finalDesignationId,
        is_active, timestamp: new Date().toISOString(),
      },
      ipAddress, userAgent,
    });

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: updatedFaculty,
    });
  } catch (error) {
    if (isDedicatedClient) await client.query('ROLLBACK');
    console.error("Error updating faculty:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (isDedicatedClient && client.release) client.release();
  }
};