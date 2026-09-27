const ProgramModel = require('../models/programModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// PROGRAM MANAGEMENT
// ==========================================

exports.addProgram = async (req, res) => {
  const { program_name, program_abbr, total_year, program_description, program_status } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    if (!program_name || !program_abbr || !total_year) {
      return res.status(400).json({ success: false, message: "Program name, abbreviation, and total years are required." });
    }

    const existingPrograms = await ProgramModel.getAll({ includeArchived: true });
    if (existingPrograms.find(p => p.program_abbr === program_abbr)) {
      return res.status(400).json({ success: false, message: "Program abbreviation already exists." });
    }

    const newProgram = await ProgramModel.create({
      program_name, program_abbr, total_year,
      program_description: program_description || null, program_status
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'programs', recordId: newProgram.program_id,
      action: 'PROGRAM_CREATED', oldValues: null,
      newValues: { program_id: newProgram.program_id, program_name, program_abbr, total_year, program_status, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Program created successfully.", data: newProgram });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.updateProgram = async (req, res) => {
  const { program_id } = req.params;
  const { program_name, program_abbr, total_year, program_description, program_status } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingProgram = await ProgramModel.findById(program_id);
    if (!existingProgram) return res.status(404).json({ success: false, message: "Program not found." });

    const updatedProgram = await ProgramModel.update(program_id, {
      program_name, program_abbr, total_year,
      program_description: program_description || null, program_status
    });

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'programs', recordId: updatedProgram.program_id,
      action: 'PROGRAM_UPDATED',
      oldValues: { program_name: existingProgram.program_name, program_abbr: existingProgram.program_abbr, total_year: existingProgram.total_year, program_status: existingProgram.program_status },
      newValues: { program_name: updatedProgram.program_name, program_abbr: updatedProgram.program_abbr, total_year: updatedProgram.total_year, program_status: updatedProgram.program_status, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Program updated successfully.", data: updatedProgram });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.deleteProgram = async (req, res) => {
  const { program_id } = req.params;
  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await ProgramModel.findById(program_id);
    if (!existing) return res.status(404).json({ success: false, message: 'Program not found.' });

    await ProgramModel.deactivate(program_id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'programs', recordId: Number(program_id),
      action: 'PROGRAM_ARCHIVED', oldValues: { program_status: existing.program_status },
      newValues: { program_id: Number(program_id), timestamp: new Date().toISOString() },
      ipAddress, userAgent,
    });

    res.json({ success: true, message: 'Program archived successfully.' });
  } catch (error) {
    console.error('Error archiving program:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.restoreProgram = async (req, res) => {
  const { program_id } = req.params;
  const userId = req.user?.id || null;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existing = await ProgramModel.findById(program_id);
    if (!existing) return res.status(404).json({ success: false, message: 'Program not found.' });

    await ProgramModel.reactivate(program_id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'programs', recordId: Number(program_id),
      action: 'PROGRAM_RESTORED', oldValues: { program_status: existing.program_status },
      newValues: { program_id: Number(program_id), timestamp: new Date().toISOString() },
      ipAddress, userAgent,
    });

    res.json({ success: true, message: 'Program restored successfully.' });
  } catch (error) {
    console.error('Error restoring program:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getPrograms = async (req, res) => {
  try {
    const { mode } = req.query;
    const programs = await ProgramModel.getAll({
      mode: ['active', 'archived', 'all'].includes(mode) ? mode : 'active'
    });
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};