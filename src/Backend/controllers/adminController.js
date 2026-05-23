const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const Admin = require('../models/adminModel');
const History = require('../models/historyModel');

exports.getHistory = async (req, res) => {
  try {
    const { id, role, designation } = req.user; 
    const isPowerUser = 
      designation?.toLowerCase() === 'superadmin' || 
      role?.toLowerCase() === 'developer';

    const history = await History.getHistory(id, isPowerUser);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};

exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body; 

  try {
    const user = await Admin.findById(username);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    const isMatch = isBcrypt ? await bcrypt.compare(password, user.password_hash) : (password === user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const expiresIn = rememberMe ? '7d' : '2h';
    const token = jwt.sign(
      { id: user.user_id, role: user.role_name }, 
      process.env.JWT_SECRET,
      { expiresIn }
    );
  
    await Admin.logAction(user.user_id, 'LOGIN', `Successful login as ${user.role_name}`);
    
    res.json({ 
      success: true, 
      token, 
      userId: user.user_id, 
      username: user.username,
      role: user.role_name, 
      changedPass: !user.changed_pass 
    });
  }  catch (err) {
  console.error("DETAILED LOGIN ERROR:", {
    message: err.message,
    stack: err.stack,
    detail: err.detail 
  });
  res.status(500).json({ success: false, message: err.message }); 
  }
};

  exports.bulkAcceptStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    await Admin.acceptStudentsBulk(ids);

    // Create one history entry per student
    for (const studentId of ids) {
      await History.logTransaction({
        user_id: req.user.id,
        user_role: req.user.role,
        user_designation: req.user.role,
        action: 'ACCEPT',
        target_id: studentId,  
        details: `Accepted student application.`
      });
    }

    res.json({ success: true, message: `${ids.length} students accepted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
};

exports.bulkRejectStudents = async (req, res) => {
  const { ids } = req.body;
  try {
    await Admin.rejectStudentsBulk(ids);

    for (const studentId of ids) {
      await History.logTransaction({
        user_id: req.user.id,
        user_role: req.user.role,
        user_designation: req.user.role,
        action: 'REJECT',
        target_id: studentId,
        details: `Rejected student application.`
      });
    }

    res.json({ success: true, message: `${ids.length} students rejected.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject students" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From JWT token
  
  try {
    const user = await Admin.findByUserId(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    const isMatch = isBcrypt 
      ? await bcrypt.compare(currentPassword, user.password_hash) 
      : (currentPassword === user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await Admin.updatePassword(userId, hashedNewPassword);
    
    await Admin.logAction(userId, 'PASSWORD_CHANGE', 'User changed their password');

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMasterlist = async (req, res) => {
  try {
    const students = await Admin.getMasterlist(); 
    res.json({ success: true, students }); 
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
};

exports.getPendingStudents = async (req, res) => {
  try {
    const students = await Admin.getPending();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pending students" });
  }
};

// backend/controllers/adminController.js (or similar)
// adminController.js

exports.getStudentFormData = async (req, res) => {
    try {
        const { id } = req.params; 
        const studentData = await Admin.getStudentFullDetails(id);
        if (!studentData) {
            return res.status(404).json({ 
                success: false, 
                message: "Student record not found" 
            });
        }
        res.json({ 
            success: true, 
            data: studentData 
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error",
            details: error.message 
        });
    }
};

//program
exports.addProgram = async (req, res) => {
    try {
        const { name, abbreviation, total_years, description, status } = req.body;

        const user = req.user; 
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const newProgram = await Admin.createProgram({
            name, abbreviation, total_years, description, status
        });

        try {
            await History.logTransaction({
                user_id: user.id, 
                user_role: user.role,
                user_designation: user.role,
                action: 'Added a Program',
                target_id: user.id, 
                details: `${user.role} added a program.`
            });
        } catch (historyError) {
            console.error("History logging failed:", historyError.message);
        }

        res.status(201).json({ 
            success: true, 
            message: "Program created successfully", 
            program: newProgram 
        });
    } catch (err) {
        console.error("Add Program Error:", err);
        res.status(500).json({ success: false, message: "Failed to create program" });
    }
};

exports.getPrograms = async (req, res) => {
    try {
        const programs = await Admin.getPrograms();
        res.json({ 
            success: true, 
            data: programs
        });
    } catch (err) {
        console.error("Get Programs Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching programs" 
        });
    }
};

// Add Section
exports.addSection = async (req, res) => {
  try {
    const { section_name, program_id, year_id, semester_id, year_level } = req.body;
    const user = req.user;

    const newSection = await Admin.createSection({
      section_name,
      program_id,
      year_id,
      semester_id,
      year_level
    });

    try {
      await History.logTransaction({
        user_id: user.id,
        user_role: user.role,
        user_designation: user.role,
        action: 'Added Section',
        target_id: user.id,
        details: `${user.role} added section ${section_name}.`
      });
    } catch (logError) {
      console.error("History log failed:", logError.message);
    }

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection
    });
  } catch (err) {
    console.error("Add Section Error:", err);
    res.status(500).json({ success: false, message: "Failed to create section" });
  }
};

// Get Sections
exports.getSections = async (req, res) => {
  try {
    const sections = await Admin.getSections();
    res.json({
      success: true,
      data: sections
    });
  } catch (err) {
    console.error("Get Sections Error:", err);
    res.status(500).json({ success: false, message: "Error fetching sections" });
  }
};

// Add Course
exports.addCourse = async (req, res) => {
  try {
    const { course_code, course_name, lec_units, lab_units, total_units, 
            course_desc, prerequisites, assignments } = req.body;
    const user = req.user;

    const newCourse = await Admin.createCourse({
      course_code,
      course_name,
      lec_units,
      lab_units,
      total_units,
      course_desc,
      prerequisites,
      assignments
    });

    try {
      await History.logTransaction({
        user_id: user.id,
        user_role: user.role,
        user_designation: user.role,
        action: 'Added Course',
        target_id: user.id,
        details: `${user.role} added course ${course_code} - ${course_name}.`
      });
    } catch (logError) {
      console.error("History log failed:", logError.message);
    }

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse
    });
  } catch (err) {
    console.error("Add Course Error:", err);
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: "Course code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Admin.getCourses();
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error("Get Courses Error:", err);
    res.status(500).json({ success: false, message: "Error fetching courses" });
  }
};

// Add Curriculum
exports.addCurriculum = async (req, res) => {
  try {
    const { program_id, curriculum_year, version_name, is_active } = req.body;
    const user = req.user;
    
    const newCurriculum = await Admin.createCurriculum({
      program_id,
      curriculum_year,
      version_name,
      is_active
    });

    try {
      await History.logTransaction({
        user_id: user.id,
        user_role: user.role,
        user_designation: user.role,
        action: 'Added Curriculum',
        target_id: user.id,
        details: `${user.role} added curriculum ${curriculum_year}.`
      });
    } catch (logError) {
      console.error("History log failed:", logError.message);
    }

    res.status(201).json({
      success: true,
      message: "Curriculum created successfully",
      data: newCurriculum
    });
  } catch (err) {
    console.error("Add Curriculum Error:", err);
    res.status(500).json({ success: false, message: "Failed to create curriculum" });
  }
};

// Get Curricula
exports.getCurricula = async (req, res) => {
  try {
    const curricula = await Admin.getCurricula();
    res.json({ success: true, data: curricula });
  } catch (err) {
    console.error("Get Curricula Error:", err);
    res.status(500).json({ success: false, message: "Error fetching curricula" });
  }
};

// Delete Curriculum
exports.deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.deleteCurriculum(id);
    res.json({ success: true, message: "Curriculum deleted" });
  } catch (err) {
    console.error("Delete Curriculum Error:", err);
    res.status(500).json({ success: false, message: "Failed to delete curriculum" });
  }
};


exports.addAcademicYear = async (req, res) => {
  try {
    const { startYear, endYear, isActive } = req.body;
    const year_label = `${startYear}-${endYear}`;
    const user = req.user;

    const newYear = await Admin.createAcademicYear({
      year_label,      // Changed from acad_year
      is_active: isActive
    });

    try {
      await History.logTransaction({
        user_id: user.id,
        user_role: user.role,
        user_designation: user.role,
        action: 'Added Academic Year',
        target_id: user.id,
        details: `${user.role} added Academic Year ${year_label}.`
      });
    } catch (logError) {
      console.error("History log failed:", logError.message);
    }

    res.status(201).json({ 
      success: true, 
      message: "Academic Year created successfully", 
      data: newYear 
    });
  } catch (err) {
    console.error("Add Academic Year Error:", err);
    res.status(500).json({ success: false, message: "Failed to create academic year" });
  }
};


exports.getAcademicYears = async (req, res) => {
  try {
    const years = await Admin.getAcademicYears();
    res.json({ 
      success: true, 
      data: years 
    });
  } catch (err) {
    console.error("Get Academic Years Error:", err);
    res.status(500).json({ success: false, message: "Error fetching academic years" });
  }
};

exports.getStudentCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { year_level, semester_id } = req.query;
    const courses = await Admin.getStudentCourses(id, year_level, semester_id);
    res.json({ success: true, courses });
  } catch (err) {
    console.error("Get Student Courses Error:", err);
    res.status(500).json({ success: false, message: "Error fetching courses" });
  }
};
// Get Student Grades
// Get Student Courses with Grades
exports.getStudentCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { year_level, semester_id } = req.query;
    const courses = await Admin.getStudentCourses(id, year_level, semester_id);
    res.json({ success: true, courses });
  } catch (err) {
    console.error("Get Student Courses Error:", err);
    res.status(500).json({ success: false, message: "Error fetching courses" });
  }
};

// Save Student Grades
exports.saveGrades = async (req, res) => {
  try {
    await Admin.saveGrades(req.body);
    res.json({ success: true, message: "Grades saved successfully" });
  } catch (err) {
    console.error("Save Grades Error:", err);
    res.status(500).json({ success: false, message: "Error saving grades" });
  }
};
