const SectionModel = require('../models/sectionModel');
const SectionAssignmentModel = require('../models/sectionassignModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// SECTIONS & SECTION ASSIGNMENTS
// ==========================================

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
    console.error("Error fetching sections:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Alias — keeps the URL /sections working
exports.getSectionsByProgram = exports.getAllSectionsByProgram;

exports.getSectionsByProgramId = async (req, res) => {
  try {
    const { programId } = req.params;
    const { yearId, semesterId, yearLevel, includeArchived } = req.query;

    const sections = await SectionModel.getByProgramAndTerm(
      programId,
      yearId ? Number(yearId) : null,
      semesterId ? Number(semesterId) : null,
      yearLevel ? String(yearLevel) : null,
      includeArchived === 'true'
    );

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching sections by program:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.addSectionAssignment = async (req, res) => {
  const {
    section_option, section_name, section_id, program_id,
    year_level, semester_id, year_id, adviser_id, is_active
  } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
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
      userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: assignment.assignment_id,
      action: 'SECTION_ASSIGNMENT_CREATED',
      oldValues: null,
      newValues: {
        section_name, year_level: finalYearLevel, semester_id: finalSemesterId,
        year_id: finalYearId, adviser_id, is_active,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent
    });

    res.json({ success: true, message: "Section assignment added successfully!", data: assignment });
  } catch (error) {
    console.error("Error adding section assignment:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.deleteSectionAssignment = async (req, res) => {
  const { assignment_id } = req.params;
  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const deactivated = await SectionModel.deactivateAssignment(assignment_id);
    if (!deactivated) {
      return res.status(404).json({ success: false, message: 'Section assignment not found.' });
    }

    await HistoryModel.log({
      userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: Number(assignment_id),
      action: 'SECTION_ARCHIVED',
      oldValues: { is_active: true },
      newValues: { assignment_id: Number(assignment_id), timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    });

    res.json({ success: true, message: 'Section archived successfully.' });
  } catch (error) {
    console.error('Error archiving section:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.restoreSectionAssignment = async (req, res) => {
  const { assignment_id } = req.params;
  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const reactivated = await SectionModel.reactivateAssignment(assignment_id);
    if (!reactivated) {
      return res.status(404).json({ success: false, message: 'Section assignment not found.' });
    }

    await HistoryModel.log({
      userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: Number(assignment_id),
      action: 'SECTION_RESTORED',
      oldValues: { is_active: false },
      newValues: { assignment_id: Number(assignment_id), timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    });

    res.json({ success: true, message: 'Section restored successfully.' });
  } catch (error) {
    console.error('Error restoring section:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

  exports.getArchivedSections = async (req, res) => {
  try {
    const sections = await SectionModel.getAllArchived();
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching archived sections:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.updateSectionAssignment = async (req, res) => {
  const { assignment_id } = req.params;
  const {
    year_id,
    semester_id,
    year_level,
    adviser_id,
    is_active,
  } = req.body;

  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await SectionAssignmentModel.getById(assignment_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Section assignment not found.' });
    }

    const updated = await SectionModel.updateAssignment(assignment_id, {
      yearId: year_id,
      semesterId: semester_id,
      yearLevel: year_level,
      adviserId: adviser_id,
      isActive: is_active,
    });

    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update section assignment.' });
    }

    await HistoryModel.log({
      userId,
      targetUserId: userId,
      tableName: 'section_assignments',
      recordId: Number(assignment_id),
      action: 'SECTION_ASSIGNMENT_UPDATED',
      oldValues: {
        year_id: existing.year_id,
        semester_id: existing.semester_id,
        year_level: existing.year_level,
        adviser_id: existing.adviser_id,
        is_active: existing.is_active,
      },
      newValues: {
        year_id: updated.year_id,
        semester_id: updated.semester_id,
        year_level: updated.year_level,
        adviser_id: updated.adviser_id,
        is_active: updated.is_active,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });

    res.json({ success: true, message: 'Section assignment updated successfully.', data: updated });
  } catch (error) {
    console.error('Error updating section assignment:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};