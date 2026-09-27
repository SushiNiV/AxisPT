const StudentManageModel = require('../models/studentmanageModel');
const GradeManageModel = require('../models/grademanageModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

exports.getStudentMasterlist = async (req, res) => {
  try {
    const { search, programId, limit, offset, includeArchived } = req.query;
    const masterlist = await StudentManageModel.getMasterlist({
      search, programId,
      includeArchived: includeArchived === 'true',
      limit, offset
    });

    const standingMap = await GradeManageModel.getAcademicStandingMap();
    const enriched = masterlist.map((student) => {
      const standing = standingMap.get(student.student_id);
      return {
        ...student,
        academic_status: standing?.status || 'None',
        academic_status_overridden: standing?.isOverridden || false
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error fetching student masterlist:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentManageModel.getById(id);
    if (!student) return res.status(404).json({ success: false, message: "Student record not found." });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const studentData = req.body;
    const studentNumber = studentData.studentNumber || studentData.student_number;
    const firstName = studentData.firstName || studentData.first_name;
    const lastName = studentData.lastName || studentData.last_name;

    if (!studentNumber || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "Student number, first name, and last name are required." });
    }

    const newStudent = await StudentManageModel.create(studentData);
    res.status(201).json({ success: true, message: "Student created successfully.", data: newStudent });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: "Student number or email already exists." });
    }
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Student ID parameter is required." });
    await StudentManageModel.update(id, req.body);
    return res.status(200).json({ success: true, message: "Student record updated successfully." });
  } catch (error) {
    console.error("Error updating student:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    console.log('[deleteStudent] id:', id, '| reason:', JSON.stringify(reason), '| body:', JSON.stringify(req.body));

    const userId = req.user.id;
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'];

    await StudentManageModel.archive(id, { reason });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'students', recordId: Number(id),
      action: 'STUDENT_ARCHIVED', oldValues: null,
      newValues: { student_id: Number(id), reason: reason || null, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.status(200).json({ success: true, message: "Student archived successfully." });
  } catch (error) {
    console.error("Error archiving student:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

exports.restoreStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers['user-agent'];

    await StudentManageModel.unarchive(id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'students', recordId: Number(id),
      action: 'STUDENT_RESTORED', oldValues: null,
      newValues: { student_id: Number(id), timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.status(200).json({ success: true, message: "Student restored successfully." });
  } catch (error) {
    console.error("Error restoring student:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

exports.updateStudentsBulk = async (req, res) => {
  const { studentIds, yearLevel, sectionId } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "studentIds (array) is required." });
  }
  if (!yearLevel && !sectionId) {
    return res.status(400).json({ success: false, message: "Provide at least a yearLevel or sectionId to update." });
  }
  try {
    const updated = await StudentManageModel.bulkUpdateEducation(studentIds, { yearLevel, sectionId });
    res.json({ success: true, message: `${updated.length} student(s) updated.`, data: updated });
  } catch (error) {
    console.error("Error batch-updating students:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.deleteStudentsBulk = async (req, res) => {
  const { studentIds, reason } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "studentIds (array) is required." });
  }

  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    let archived = 0;
    const failures = [];

    for (const id of studentIds) {
      try {
        await StudentManageModel.archive(id, { reason: reason || null });
        archived++;
        await HistoryModel.log({
          userId, targetUserId: userId, tableName: 'students', recordId: Number(id),
          action: 'STUDENT_ARCHIVED', oldValues: null,
          newValues: { student_id: Number(id), reason: reason || null, timestamp: new Date().toISOString() },
          ipAddress, userAgent
        });
      } catch (err) {
        console.error(`Failed to archive student ${id}:`, err.message);
        failures.push({ id, error: err.message });
      }
    }

    res.json({ success: true, message: `${archived} student(s) archived.`, data: { archived, failures } });
  } catch (error) {
    console.error("Error batch-archiving students:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};