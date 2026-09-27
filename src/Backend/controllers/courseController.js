const db = require('../config/db');
const CourseModel = require('../models/courseModel');
const HistoryModel = require('../models/historyModel');

const getIpAddress = (req) => req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

// ==========================================
// COURSE MANAGEMENT
// ==========================================

exports.getCourses = async (req, res) => {
  try {
    const courses = await CourseModel.getAll();
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await CourseModel.getById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found." });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

exports.addCourse = async (req, res) => {
  const { course_code, course_name, lec_units, lab_units, course_desc, prerequisites, assignments } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const lecUnits = parseInt(lec_units) || 0;
  const labUnits = parseInt(lab_units) || 0;

  const client = db.getClient ? await db.getClient() : db;

  try {
    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: "Course code and name are required." });
    }
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ success: false, message: "Please add at least one curriculum assignment." });
    }

    const existingCourse = await CourseModel.getByCode(course_code);
    if (existingCourse) return res.status(400).json({ success: false, message: "Course code already exists." });

    if (db.getClient) await client.query('BEGIN');

    const newCourse = await CourseModel.create({
      course_code: course_code.toUpperCase(),
      course_name: course_name.toUpperCase(),
      lec_units: lecUnits,
      lab_units: labUnits,
      course_desc: course_desc || null,
      is_active: true,
      prerequisites: prerequisites || []
    });

    for (const assignment of assignments) {
      await CourseModel.addToCurriculum(
        assignment.curriculum_id, newCourse.course_id,
        assignment.year_level, assignment.semester_id
      );
    }

    if (prerequisites && prerequisites.length > 0) {
      for (const assignment of assignments) {
        const curriculumCourseResult = await client.query(`
          SELECT id FROM curriculum_courses 
          WHERE curriculum_id = $1 AND course_id = $2
        `, [assignment.curriculum_id, newCourse.course_id]);

        const curriculumCourseId = curriculumCourseResult.rows[0]?.id;

        if (curriculumCourseId) {
          for (const prereqCourseId of prerequisites) {
            await client.query(`
              INSERT INTO curriculum_course_prerequisites (curriculum_course_id, prerequisite_course_id)
              VALUES ($1, $2)
            `, [curriculumCourseId, prereqCourseId]);
          }
        }
      }
    }

    if (db.getClient) await client.query('COMMIT');

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'courses', recordId: newCourse.course_id,
      action: 'COURSE_CREATED', oldValues: null,
      newValues: { course_id: newCourse.course_id, course_code: newCourse.course_code, course_name: newCourse.course_name, timestamp: new Date().toISOString() },
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Course created successfully.", data: newCourse });
  } catch (error) {
    if (db.getClient) await client.query('ROLLBACK');
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (db.getClient && client.release) client.release();
  }
};

exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_code, course_name, lec_units, lab_units, course_desc, grading_scheme, assignments, prerequisites } = req.body;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const client = db.getClient ? await db.getClient() : db;

  try {
    if (db.getClient) await client.query('BEGIN');

    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: "Course code and name are required." });
    }

    const existingCourse = await CourseModel.getById(id);
    if (!existingCourse) return res.status(404).json({ success: false, message: "Course not found." });

    if (course_code.toUpperCase() !== existingCourse.course_code) {
      const codeClash = await CourseModel.getByCode(course_code);
      if (codeClash && codeClash.course_id !== Number(id)) {
        return res.status(400).json({ success: false, message: "Course code already exists." });
      }
    }

    const updatedCourse = await CourseModel.update(id, {
      course_code: course_code.toUpperCase(),
      course_name: course_name.toUpperCase(),
      lec_units: parseInt(lec_units) || 0,
      lab_units: parseInt(lab_units) || 0,
      course_desc: course_desc || null,
      grading_scheme: grading_scheme || null,
      prerequisites: prerequisites || []
    });

    if (assignments && assignments.length > 0) {
      await client.query('DELETE FROM curriculum_courses WHERE course_id = $1', [id]);

      for (const assignment of assignments) {
        await client.query(`
          INSERT INTO curriculum_courses (curriculum_id, course_id, year_level, semester_id)
          VALUES ($1, $2, $3, $4)
        `, [assignment.curriculum_id, id, assignment.year_level, assignment.semester_id]);
      }
    }

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'courses', recordId: id,
      action: 'COURSE_UPDATED', oldValues: existingCourse, newValues: updatedCourse,
      ipAddress, userAgent
    });

    if (db.getClient) await client.query('COMMIT');

    const finalCourse = await CourseModel.getById(id);
    res.json({ success: true, message: "Course updated successfully.", data: finalCourse });
  } catch (error) {
    if (db.getClient) await client.query('ROLLBACK');
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    if (db.getClient && client.release) client.release();
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  try {
    const existingCourse = await CourseModel.getById(id);
    if (!existingCourse) return res.status(404).json({ success: false, message: "Course not found." });

    await CourseModel.delete(id);

    await HistoryModel.log({
      userId, targetUserId: userId, tableName: 'courses', recordId: id,
      action: 'COURSE_DELETED', oldValues: existingCourse, newValues: null,
      ipAddress, userAgent
    });

    res.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: "This course can't be deleted because it's already referenced by a curriculum, grades, or other records."
      });
    }
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};