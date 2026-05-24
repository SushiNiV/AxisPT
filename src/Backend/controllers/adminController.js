const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const AdminModel = require('../models/adminModel');
const ProgramModel = require('../models/programModel');
const AcademicYearModel = require('../models/acadyearModel');
const CurriculumModel = require('../models/curriculumModel');
const FacultyModel = require('../models/facultyModel');
const SectionModel = require('../models/sectionModel');
const SectionAssignmentModel = require('../models/sectionassignModel');
const CourseModel = require('../models/courseModel');

const UserModel = require('../models/userModel');
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
    const filteredRoles = roles.filter(role => role.role_name !== 'STUDENT');
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
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    await db.query('BEGIN');

    let finalDesignationId = designation_id;

    if (new_designation_name) {
      const newDesignation = await db.query(`
        INSERT INTO designations (designation_name)
        VALUES ($1)
        ON CONFLICT (designation_name) DO NOTHING
        RETURNING designation_id
      `, [new_designation_name]);
      
      if (newDesignation.rows.length > 0) {
        finalDesignationId = newDesignation.rows[0].designation_id;
      } else {
        const existingDesignation = await db.query(`
          SELECT designation_id FROM designations WHERE designation_name = $1
        `, [new_designation_name]);
        finalDesignationId = existingDesignation.rows[0].designation_id;
      }
    }

    const plainPassword = `axis-cpt-${last_name.toLowerCase()}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userResult = await db.query(`
      INSERT INTO users (username, password_hash, school_email, is_active, changed_pass)
      VALUES ($1, $2, $3, $4, false)
      RETURNING user_id
    `, [username, hashedPassword, email, is_active]);

    const newUserId = userResult.rows[0].user_id;

    await db.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [newUserId, role_id]);

    await db.query(`
      INSERT INTO faculties (user_id, last_name, first_name, middle_name, suffix, designation, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [newUserId, last_name, first_name, middle_name, suffix, finalDesignationId, is_active]);

    await db.query('COMMIT');

    res.json({ 
      success: true, 
      message: "User created successfully",
      password: plainPassword
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYearModel.getAll();
    res.json({ success: true, data: years });
  } catch (error) {
    console.error("Error fetching academic years:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addAcademicYear = async (req, res) => {
  const { year_label, is_active, current_sem } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    if (!year_label) {
      return res.status(400).json({ 
        success: false, 
        message: "Year label is required." 
      });
    }

    const existingYears = await AcademicYearModel.getAll();
    const existing = existingYears.find(y => y.year_label === year_label);

    if (existing) {
      await HistoryModel.log({
        userId: userId,
        targetUserId: userId,
        tableName: 'academic_year',
        recordId: null,
        action: 'ACADEMIC_YEAR_CREATE_FAILED',
        oldValues: null,
        newValues: { 
          year_label, 
          reason: 'Academic year already exists',
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });

      return res.status(400).json({ 
        success: false, 
        message: "Academic year already exists." 
      });
    }

    const newYear = await AcademicYearModel.create({
      year_label,
      is_active: is_active || false,
      current_sem: current_sem || null
    });

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: newYear.year_id,
      action: 'ACADEMIC_YEAR_CREATED',
      oldValues: null,
      newValues: {
        year_id: newYear.year_id,
        year_label: newYear.year_label,
        is_active: newYear.is_active,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Academic year created successfully.",
      data: newYear
    });

  } catch (error) {
    console.error("Error creating academic year:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: null,
      action: 'ACADEMIC_YEAR_CREATE_ERROR',
      oldValues: null,
      newValues: {
        year_label,
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

exports.updateAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const { year_label, is_active, current_sem } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    
    if (!existingYear) {
      return res.status(404).json({ 
        success: false, 
        message: "Academic year not found." 
      });
    }

    const updatedYear = await AcademicYearModel.update(year_id, {
      year_label: year_label || existingYear.year_label,
      is_active: is_active !== undefined ? is_active : existingYear.is_active,
      current_sem: current_sem !== undefined ? current_sem : existingYear.current_sem
    });

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: updatedYear.year_id,
      action: 'ACADEMIC_YEAR_UPDATED',
      oldValues: {
        year_label: existingYear.year_label,
        is_active: existingYear.is_active,
        current_sem: existingYear.current_sem
      },
      newValues: {
        year_label: updatedYear.year_label,
        is_active: updatedYear.is_active,
        current_sem: updatedYear.current_sem,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Academic year updated successfully.",
      data: updatedYear
    });

  } catch (error) {
    console.error("Error updating academic year:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: year_id,
      action: 'ACADEMIC_YEAR_UPDATE_ERROR',
      oldValues: null,
      newValues: {
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

exports.deleteAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    
    if (!existingYear) {
      return res.status(404).json({ 
        success: false, 
        message: "Academic year not found." 
      });
    }

    if (existingYear.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete the active academic year. Set another year as active first." 
      });
    }

    await AcademicYearModel.delete(year_id);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: year_id,
      action: 'ACADEMIC_YEAR_DELETED',
      oldValues: {
        year_label: existingYear.year_label
      },
      newValues: {
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Academic year deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting academic year:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: year_id,
      action: 'ACADEMIC_YEAR_DELETE_ERROR',
      oldValues: null,
      newValues: {
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

exports.updateAcademicYearSemester = async (req, res) => {
  const { year_id } = req.params;
  const { current_sem } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    
    if (!existingYear) {
      return res.status(404).json({ 
        success: false, 
        message: "Academic year not found." 
      });
    }

    const oldSemester = existingYear.current_sem;

    const updatedYear = await AcademicYearModel.updateSemester(year_id, current_sem);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: year_id,
      action: 'SEMESTER_CHANGED',
      oldValues: { current_sem: oldSemester },
      newValues: { 
        current_sem: current_sem,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Semester updated successfully.",
      data: updatedYear
    });

  } catch (error) {
    console.error("Error updating semester:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};

exports.activateAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    
    if (!existingYear) {
      return res.status(404).json({ 
        success: false, 
        message: "Academic year not found." 
      });
    }

    const activatedYear = await AcademicYearModel.setActive(year_id);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'academic_year',
      recordId: year_id,
      action: 'ACADEMIC_YEAR_ACTIVATED',
      oldValues: {
        is_active: existingYear.is_active
      },
      newValues: {
        is_active: true,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Academic year activated successfully.",
      data: activatedYear
    });

  } catch (error) {
    console.error("Error activating academic year:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};

exports.getActiveSectionsByProgram = async (req, res) => {
  const { program_id } = req.query;
  
  try {
    const sections = await SectionModel.getActiveByProgramId(program_id);
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching active sections:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getAllSectionsByProgram = async (req, res) => {
  const { program_id } = req.query;
  
  try {
    const sections = await SectionModel.getAllByProgram(program_id);
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching all sections:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getSectionsByProgram = async (req, res) => {
  const { program_id } = req.query;
  
  try {
    const sections = await SectionModel.getAllByProgram(program_id);
    console.log("Sections returned:", sections);
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addSectionAssignment = async (req, res) => {
  const { 
    section_option, 
    section_name, 
    section_number, 
    section_id, 
    program_id, 
    year_level, 
    semester_id, 
    year_id, 
    adviser_id, 
    is_active 
  } = req.body;
  
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    let finalSectionId = section_id;
    let finalYearLevel = year_level;
    let finalSemesterId = semester_id;
    let finalYearId = year_id;
    
    if (section_option === "new") {
      finalSectionId = await SectionAssignmentModel.createOrGetSection(section_name, program_id);
    } else if (section_option === "existing") {
      const existingAssignment = await SectionAssignmentModel.getLatestAssignmentBySectionId(section_id);
      if (existingAssignment) {
        finalYearLevel = existingAssignment.year_level;
        finalSemesterId = existingAssignment.semester_id;
        if (!finalYearId) finalYearId = existingAssignment.year_id;
      }
    }
    
    const assignment = await SectionAssignmentModel.createAssignment({
      section_id: finalSectionId,
      year_id: finalYearId,
      semester_id: finalSemesterId,
      year_level: finalYearLevel,
      adviser_id: adviser_id,
      is_active: is_active
    });
    
    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: assignment.assignment_id,
      action: 'SECTION_ASSIGNMENT_CREATED',
      oldValues: null,
      newValues: {
        section_name: section_name || null,
        year_level: finalYearLevel,
        semester_id: finalSemesterId,
        year_id: finalYearId,
        adviser_id: adviser_id,
        is_active: is_active,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });
    
    res.json({ success: true, message: "Section assignment added successfully!", data: assignment });
    
  } catch (error) {
    console.error("Error adding section assignment:", error);
    
    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: null,
      action: 'SECTION_ASSIGNMENT_ERROR',
      oldValues: null,
      newValues: {
        error: error.message,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });
    
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getCurricula = async (req, res) => {
  try {
    const curricula = await CurriculumModel.getAll();
    res.json({ success: true, data: curricula });
  } catch (error) {
    console.error("Error fetching curricula:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addCurriculum = async (req, res) => {
  const { program_id, start_year, version_name, is_active } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    if (!program_id || !start_year || !version_name) {
      return res.status(400).json({ 
        success: false, 
        message: "Program, start year, and version are required." 
      });
    }

    const newCurriculum = await CurriculumModel.create({
      program_id,
      start_year,
      version_name,
      is_active: is_active || false
    });

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'curricula',
      recordId: newCurriculum.curriculum_id,
      action: 'CURRICULUM_CREATED',
      oldValues: null,
      newValues: {
        curriculum_id: newCurriculum.curriculum_id,
        program_id: newCurriculum.program_id,
        start_year: newCurriculum.start_year,
        version_name: newCurriculum.version_name,
        is_active: newCurriculum.is_active,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Curriculum created successfully.",
      data: newCurriculum
    });

  } catch (error) {
    console.error("Error creating curriculum:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'curricula',
      recordId: null,
      action: 'CURRICULUM_CREATE_ERROR',
      oldValues: null,
      newValues: {
        program_id,
        start_year,
        version_name,
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

exports.updateCurriculum = async (req, res) => {
  const { curriculum_id } = req.params;
  const { program_id, start_year, version_name, is_active } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await CurriculumModel.getById(curriculum_id);
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Curriculum not found." 
      });
    }

    const updatedCurriculum = await CurriculumModel.update(curriculum_id, {
      program_id: program_id || existing.program_id,
      start_year: start_year || existing.start_year,
      version_name: version_name || existing.version_name,
      is_active: is_active !== undefined ? is_active : existing.is_active
    });

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'curricula',
      recordId: curriculum_id,
      action: 'CURRICULUM_UPDATED',
      oldValues: {
        program_id: existing.program_id,
        start_year: existing.start_year,
        version_name: existing.version_name,
        is_active: existing.is_active
      },
      newValues: {
        program_id: updatedCurriculum.program_id,
        start_year: updatedCurriculum.start_year,
        version_name: updatedCurriculum.version_name,
        is_active: updatedCurriculum.is_active,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Curriculum updated successfully.",
      data: updatedCurriculum
    });

  } catch (error) {
    console.error("Error updating curriculum:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};

exports.deleteCurriculum = async (req, res) => {
  const { curriculum_id } = req.params;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await CurriculumModel.getById(curriculum_id);
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Curriculum not found." 
      });
    }

    await CurriculumModel.delete(curriculum_id);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'curricula',
      recordId: curriculum_id,
      action: 'CURRICULUM_DELETED',
      oldValues: {
        program_id: existing.program_id,
        start_year: existing.start_year,
        version_name: existing.version_name
      },
      newValues: {
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Curriculum deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting curriculum:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
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

exports.updateProgram = async (req, res) => {
  const { program_id } = req.params;
  const { program_name, program_abbr, total_year, program_description, program_status } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const existingProgram = await ProgramModel.findById(program_id);
    
    if (!existingProgram) {
      return res.status(404).json({ 
        success: false, 
        message: "Program not found." 
      });
    }

    const updatedProgram = await ProgramModel.update(program_id, {
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
      recordId: updatedProgram.program_id,
      action: 'PROGRAM_UPDATED',
      oldValues: {
        program_name: existingProgram.program_name,
        program_abbr: existingProgram.program_abbr,
        total_year: existingProgram.total_year,
        program_status: existingProgram.program_status
      },
      newValues: {
        program_name: updatedProgram.program_name,
        program_abbr: updatedProgram.program_abbr,
        total_year: updatedProgram.total_year,
        program_status: updatedProgram.program_status,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Program updated successfully.",
      data: updatedProgram
    });

  } catch (error) {
    console.error("Error updating program:", error);

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'programs',
      recordId: program_id,
      action: 'PROGRAM_UPDATE_ERROR',
      oldValues: null,
      newValues: {
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

exports.getCourses = async (req, res) => {
  try {
    const courses = await CourseModel.getAll();
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addCourse = async (req, res) => {
  const { course_code, course_name, lec_units, lab_units, course_desc, prerequisites, assignments } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const lecUnits = parseInt(lec_units) || 0;
  const labUnits = parseInt(lab_units) || 0;

  try {
    if (!course_code || !course_name || !lecUnits) {
      return res.status(400).json({ 
        success: false, 
        message: "Course code, name, and lec units are required." 
      });
    }

    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please add at least one curriculum assignment." 
      });
    }

    const existingCourse = await CourseModel.getByCode(course_code);
    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        message: "Course code already exists." 
      });
    }

    await db.query('BEGIN');

    const newCourse = await CourseModel.create({
      course_code: course_code.toUpperCase(),
      course_name: course_name.toUpperCase(),
      lec_units: lecUnits,
      lab_units: labUnits,
      course_desc: course_desc || null,
      is_active: true
    });

    for (const assignment of assignments) {
      await CourseModel.addToCurriculum(
        assignment.curriculum_id,
        newCourse.course_id,
        assignment.year_level,
        assignment.semester_id
      );
    }

    console.log("prerequisites:", prerequisites);
    console.log("assignments:", assignments);
    console.log("newCourse.course_id:", newCourse.course_id);

    if (prerequisites && prerequisites.length > 0) {
      for (const assignment of assignments) {
        const curriculumCourseResult = await db.query(`
          SELECT id FROM curriculum_courses 
          WHERE curriculum_id = $1 AND course_id = $2
        `, [assignment.curriculum_id, newCourse.course_id]);
        
        const curriculumCourseId = curriculumCourseResult.rows[0]?.id;
        
        if (!curriculumCourseId) {
          throw new Error(`No curriculum_course found for assignment: ${assignment.curriculum_id}`);
        }
        
        for (const prereqCourseId of prerequisites) {
          await db.query(`
            INSERT INTO curriculum_course_prerequisites (curriculum_course_id, prerequisite_course_id)
            VALUES ($1, $2)
          `, [curriculumCourseId, prereqCourseId]);
        }
      }
    }

    await db.query('COMMIT');

    await HistoryModel.log({
      userId: userId,
      targetUserId: userId,
      tableName: 'courses',
      recordId: newCourse.course_id,
      action: 'COURSE_CREATED',
      oldValues: null,
      newValues: {
        course_id: newCourse.course_id,
        course_code: newCourse.course_code,
        course_name: newCourse.course_name,
        lec_units: newCourse.lec_units,
        lab_units: newCourse.lab_units,
        prerequisites_count: prerequisites?.length || 0,
        assignments_count: assignments.length,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ 
      success: true, 
      message: "Course created successfully.",
      data: newCourse
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error creating course:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error." 
    });
  }
};

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await FacultyModel.getAll();
    res.json({ success: true, data: faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
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
      let displayName = '';
      if (item.first_name && item.last_name) {
        displayName = `${item.first_name} ${item.last_name}`;
      } else if (item.user_name) {
        displayName = item.user_name;
      } else {
        displayName = 'System';
      }
      
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
        case 'PROGRAM_UPDATED':
          formattedAction = 'Program Updated';
          break;
        case 'PROGRAM_UPDATE_ERROR':
          formattedAction = 'Program Update Error';
          break;
        case 'ACADEMIC_YEAR_CREATED':
          formattedAction = 'Academic Year Created';
          break;
        case 'ACADEMIC_YEAR_CREATE_FAILED':
          formattedAction = 'Academic Year Creation Failed';
          break;
        case 'ACADEMIC_YEAR_CREATE_ERROR':
          formattedAction = 'Academic Year Creation Error';
          break;
        case 'ACADEMIC_YEAR_UPDATED':
          formattedAction = 'Academic Year Updated';
          break;
        case 'ACADEMIC_YEAR_UPDATE_ERROR':
          formattedAction = 'Academic Year Update Error';
          break;
        case 'ACADEMIC_YEAR_DELETED':
          formattedAction = 'Academic Year Deleted';
          break;
        case 'ACADEMIC_YEAR_DELETE_ERROR':
          formattedAction = 'Academic Year Delete Error';
          break;
        case 'ACADEMIC_YEAR_ACTIVATED':
          formattedAction = 'Academic Year Activated';
          break;
        case 'CURRICULUM_CREATED':
          formattedAction = 'Curriculum Created';
          break;
        case 'CURRICULUM_UPDATED':
          formattedAction = 'Curriculum Updated';
          break;
        case 'CURRICULUM_DELETED':
          formattedAction = 'Curriculum Deleted';
          break;
        default:
          formattedAction = item.action.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, char => char.toUpperCase());
      }
      
      let formattedDetails = '';
      
      if (item.new_values && typeof item.new_values === 'object') {
        const newValues = item.new_values;
        const oldValues = item.old_values || {};
        
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
            
          case 'PROGRAM_UPDATED':
            formattedDetails = `${displayName} updated program: ${newValues.program_name} (${newValues.program_abbr})`;
            break;
            
          case 'PROGRAM_UPDATE_ERROR':
            formattedDetails = `Error updating program: ${newValues.error}`;
            break;
            
          case 'CURRICULUM_CREATED':
            formattedDetails = `${displayName} created curriculum for program ID ${newValues.program_id} (${newValues.version_name}) for year ${newValues.start_year}`;
            break;
            
          case 'CURRICULUM_UPDATED':
            formattedDetails = `${displayName} updated curriculum for program ID ${newValues.program_id}`;
            break;
            
          case 'CURRICULUM_DELETED':
            formattedDetails = `${displayName} deleted curriculum for program ID ${oldValues.program_id} (${oldValues.version_name})`;
            break;
            
          case 'SEMESTER_CHANGED':
            const getSemesterName = (semId) => {
              if (semId === 1) return '1st Semester';
              if (semId === 2) return '2nd Semester';
              if (semId === 3) return 'Summer Term';
              return 'None';
            };
            formattedDetails = `${displayName} changed semester from ${getSemesterName(oldValues.current_sem)} to ${getSemesterName(newValues.current_sem)}`;
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