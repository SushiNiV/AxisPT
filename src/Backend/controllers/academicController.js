const AcademicYearModel = require('../models/acadyearModel');
const CurriculumModel = require('../models/curriculumModel');
const SectionModel = require('../models/sectionModel');
const SectionAssignmentModel = require('../models/sectionassignModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// ACADEMIC YEAR & SEMESTER MANAGEMENT
// ==========================================

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
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    if (!year_label) return res.status(400).json({ success: false, message: "Year label is required." });

    const existingYears = await AcademicYearModel.getAll();
    if (existingYears.some(y => y.year_label === year_label)) {
      return res.status(400).json({ success: false, message: "Academic year already exists." });
    }

    const newYear = await AcademicYearModel.create({
      year_label, is_active: is_active || false, current_sem: current_sem || null
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'academic_year', recordId: newYear.year_id,
      action: 'ACADEMIC_YEAR_CREATED', oldValues: null,
      newValues: { year_id: newYear.year_id, year_label: newYear.year_label, is_active: newYear.is_active, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Academic year created successfully.", data: newYear });
  } catch (error) {
    console.error("Error creating academic year:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.updateAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const { year_label, is_active, current_sem } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    if (!existingYear) return res.status(404).json({ success: false, message: "Academic year not found." });

    const updatedYear = await AcademicYearModel.update(year_id, {
      year_label: year_label || existingYear.year_label,
      is_active: is_active !== undefined ? is_active : existingYear.is_active,
      current_sem: current_sem !== undefined ? current_sem : existingYear.current_sem
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'academic_year', recordId: updatedYear.year_id,
      action: 'ACADEMIC_YEAR_UPDATED',
      oldValues: { year_label: existingYear.year_label, is_active: existingYear.is_active, current_sem: existingYear.current_sem },
      newValues: { year_label: updatedYear.year_label, is_active: updatedYear.is_active, current_sem: updatedYear.current_sem, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Academic year updated successfully.", data: updatedYear });
  } catch (error) {
    console.error("Error updating academic year:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.deleteAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    if (!existingYear) return res.status(404).json({ success: false, message: "Academic year not found." });
    if (existingYear.is_active) return res.status(400).json({ success: false, message: "Cannot delete active academic year. Set another year active first." });

    await AcademicYearModel.delete(year_id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'academic_year', recordId: year_id,
      action: 'ACADEMIC_YEAR_DELETED', oldValues: { year_label: existingYear.year_label },
      newValues: { timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Academic year deleted successfully." });
  } catch (error) {
    console.error("Error deleting academic year:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.updateAcademicYearSemester = async (req, res) => {
  const { year_id } = req.params;
  const { current_sem } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    if (!existingYear) return res.status(404).json({ success: false, message: "Academic year not found." });

    const updatedYear = await AcademicYearModel.updateSemester(year_id, current_sem);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'academic_year', recordId: year_id,
      action: 'SEMESTER_CHANGED', oldValues: { current_sem: existingYear.current_sem },
      newValues: { current_sem, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Semester updated successfully.", data: updatedYear });
  } catch (error) {
    console.error("Error updating semester:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.activateAcademicYear = async (req, res) => {
  const { year_id } = req.params;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingYear = await AcademicYearModel.findById(year_id);
    if (!existingYear) return res.status(404).json({ success: false, message: "Academic year not found." });

    const activatedYear = await AcademicYearModel.setActive(year_id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'academic_year', recordId: year_id,
      action: 'ACADEMIC_YEAR_ACTIVATED', oldValues: { is_active: existingYear.is_active },
      newValues: { is_active: true, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Academic year activated successfully.", data: activatedYear });
  } catch (error) {
    console.error("Error activating academic year:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

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
  const { section_option, section_name, section_id, program_id, year_level, semester_id, year_id, adviser_id, is_active } = req.body;
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
      section_id: finalSectionId, year_id: finalYearId, semester_id: finalSemesterId,
      year_level: finalYearLevel, adviser_id: adviser_id, is_active: is_active
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'section_assignments', recordId: assignment.assignment_id,
      action: 'SECTION_ASSIGNMENT_CREATED', oldValues: null,
      newValues: { section_name, year_level: finalYearLevel, semester_id: finalSemesterId, year_id: finalYearId, adviser_id, is_active, timestamp: new Date().toISOString() },
      ipAddress, userAgent
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
    if (!deactivated) return res.status(404).json({ success: false, message: 'Section assignment not found.' });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'section_assignments', recordId: Number(assignment_id),
      action: 'SECTION_ARCHIVED', oldValues: { is_active: true },
      newValues: { assignment_id: Number(assignment_id), timestamp: new Date().toISOString() },
      ipAddress, userAgent,
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
    if (!reactivated) return res.status(404).json({ success: false, message: 'Section assignment not found.' });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'section_assignments', recordId: Number(assignment_id),
      action: 'SECTION_RESTORED', oldValues: { is_active: false },
      newValues: { assignment_id: Number(assignment_id), timestamp: new Date().toISOString() },
      ipAddress, userAgent,
    });

    res.json({ success: true, message: 'Section restored successfully.' });
  } catch (error) {
    console.error('Error restoring section:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ==========================================
// CURRICULUM MANAGEMENT
// ==========================================

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
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    if (!program_id || !start_year || !version_name) {
      return res.status(400).json({ success: false, message: "Program, start year, and version are required." });
    }

    const newCurriculum = await CurriculumModel.create({ program_id, start_year, version_name, is_active: is_active || false });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'curricula', recordId: newCurriculum.curriculum_id,
      action: 'CURRICULUM_CREATED', oldValues: null,
      newValues: { curriculum_id: newCurriculum.curriculum_id, program_id, start_year, version_name, is_active: newCurriculum.is_active, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Curriculum created successfully.", data: newCurriculum });
  } catch (error) {
    console.error("Error creating curriculum:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.updateCurriculum = async (req, res) => {
  const { curriculum_id } = req.params;
  const { program_id, start_year, version_name, is_active } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await CurriculumModel.getById(curriculum_id);
    if (!existing) return res.status(404).json({ success: false, message: "Curriculum not found." });

    const updatedCurriculum = await CurriculumModel.update(curriculum_id, {
      program_id: program_id || existing.program_id,
      start_year: start_year || existing.start_year,
      version_name: version_name || existing.version_name,
      is_active: is_active !== undefined ? is_active : existing.is_active
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'curricula', recordId: curriculum_id,
      action: 'CURRICULUM_UPDATED',
      oldValues: { program_id: existing.program_id, start_year: existing.start_year, version_name: existing.version_name, is_active: existing.is_active },
      newValues: { program_id: updatedCurriculum.program_id, start_year: updatedCurriculum.start_year, version_name: updatedCurriculum.version_name, is_active: updatedCurriculum.is_active, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Curriculum updated successfully.", data: updatedCurriculum });
  } catch (error) {
    console.error("Error updating curriculum:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.deleteCurriculum = async (req, res) => {
  const { curriculum_id } = req.params;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await CurriculumModel.getById(curriculum_id);
    if (!existing) return res.status(404).json({ success: false, message: "Curriculum not found." });

    await CurriculumModel.delete(curriculum_id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'curricula', recordId: curriculum_id,
      action: 'CURRICULUM_DELETED',
      oldValues: { program_id: existing.program_id, start_year: existing.start_year, version_name: existing.version_name },
      newValues: { timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Curriculum deleted successfully." });
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};