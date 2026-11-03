const HistoryModel = require('../models/historyModel');

// ==========================================
// SYSTEM HISTORY / AUDIT LOGS
// ==========================================

exports.getHistory = async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const history = await HistoryModel.getHistoryLogs({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedHistory = history.map(item => {
      let displayName = 'System';
      if (item.first_name && item.last_name) {
        displayName = `${item.first_name} ${item.last_name}`;
      } else if (item.user_name) {
        displayName = item.user_name;
      }

      const actionMap = {
        'LOGIN_SUCCESS': 'Login Success',
        'LOGIN_FAILED': 'Login Failed',
        'BULK_ACCEPT': 'Bulk Accept',
        'BULK_REJECT': 'Bulk Reject',
        'STUDENT_ARCHIVED': 'Student Archived',
        'STUDENT_RESTORED': 'Student Restored',
        'STUDENT_UPDATED': 'Student Updated',
        'PASSWORD_CHANGED': 'Password Changed',
        'PASSWORD_CHANGE_FAILED': 'Password Change Failed',
        'PROGRAM_CREATED': 'Program Created',
        'PROGRAM_UPDATED': 'Program Updated',
        'ACADEMIC_YEAR_CREATED': 'Academic Year Created',
        'ACADEMIC_YEAR_UPDATED': 'Academic Year Updated',
        'ACADEMIC_YEAR_DELETED': 'Academic Year Deleted',
        'ACADEMIC_YEAR_ACTIVATED': 'Academic Year Activated',
        'CURRICULUM_CREATED': 'Curriculum Created',
        'CURRICULUM_UPDATED': 'Curriculum Updated',
        'CURRICULUM_DELETED': 'Curriculum Deleted'
      };

      const formattedAction = actionMap[item.action] || item.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      let formattedDetails = '';

      if (item.new_values && typeof item.new_values === 'object') {
        const newValues = item.new_values;
        const oldValues = item.old_values || {};

        switch (item.action) {
          case 'LOGIN_SUCCESS':
            formattedDetails = `${displayName} logged in`;
            if (newValues.designation) formattedDetails += ` as ${newValues.designation}`;
            break;
          case 'LOGIN_FAILED':
            formattedDetails = `${displayName} failed to log in - ${newValues.reason || 'Invalid credentials'}`;
            break;
          case 'PASSWORD_CHANGED':
            formattedDetails = `${displayName} changed their password`;
            break;
          
          // --- PROGRAMS ---
          case 'PROGRAM_CREATED':
          case 'PROGRAM_UPDATED':
            formattedDetails = `${displayName} ${item.action === 'PROGRAM_CREATED' ? 'created' : 'updated'} program ${newValues.program_name || ''} (${newValues.program_abbr || ''})`;
            break;
          case 'PROGRAM_ARCHIVED':
            formattedDetails = `${displayName} archived program ${newValues.program_name || `#${newValues.program_id}`}`;
            break;
          case 'PROGRAM_RESTORED':
            formattedDetails = `${displayName} restored program ${newValues.program_name || `#${newValues.program_id}`}`;
            break;
          
          // --- SECTIONS ---
          case 'SECTION_ARCHIVED':
            formattedDetails = `${displayName} archived section ${newValues.section_name || `#${newValues.assignment_id}`}`;
            break;
          case 'SECTION_RESTORED':
            formattedDetails = `${displayName} restored section ${newValues.section_name || `#${newValues.assignment_id}`}`;
            break;
          
          // --- CURRICULA ---
          case 'CURRICULUM_CREATED':
            formattedDetails = `${displayName} created curriculum (${newValues.version_name || 'New Version'}) for program ${newValues.program_name || `#${newValues.program_id}`}`;
            break;
          case 'CURRICULUM_UPDATED':
            formattedDetails = `${displayName} updated curriculum (${newValues.version_name || 'New Version'}) for program ${newValues.program_name || `#${newValues.program_id}`}`;
            break;
          
          // --- COURSES ---
          case 'COURSE_CREATED':
            formattedDetails = `${displayName} created course ${newValues.course_code || ''} (${newValues.course_name || ''})`;
            break;
          case 'COURSE_UPDATED':
            formattedDetails = `${displayName} updated course ${newValues.course_code || ''} (${newValues.course_name || ''})`;
            break;
          case 'COURSE_ARCHIVED':
            formattedDetails = `${displayName} archived course ${newValues.course_code || `#${newValues.course_id}`}`;
            break;
          case 'COURSE_RESTORED':
            formattedDetails = `${displayName} restored course ${newValues.course_code || `#${newValues.course_id}`}`;
            break;

          // --- STUDENTS ---
          case 'STUDENT_ARCHIVED':
            formattedDetails = `${displayName} archived student ${newValues.student_name || newValues.student_number || `#${newValues.student_id}`}`;
            if (newValues.reason) formattedDetails += ` (${newValues.reason})`;
            break;
          case 'STUDENT_RESTORED':
            formattedDetails = `${displayName} restored student ${newValues.student_name || newValues.student_number || `#${newValues.student_id}`}`;
            break;
          case 'STUDENT_UPDATED':
            formattedDetails = `${displayName} updated student ${newValues.student_name || newValues.student_number || `#${newValues.student_id}`}`;
            break;

          // --- ACADEMIC YEAR ---
          case 'ACADEMIC_YEAR_CREATED':
            formattedDetails = `${displayName} created academic year ${newValues.year_label || ''}`;
            break;
          case 'ACADEMIC_YEAR_UPDATED':
            formattedDetails = `${displayName} updated academic year ${newValues.year_label || ''}`;
            break;
          case 'ACADEMIC_YEAR_ACTIVATED':
            formattedDetails = `${displayName} set academic year ${newValues.year_label || ''} as active`;
            break;
          case 'SEMESTER_CHANGED':
            const getSemesterName = (s) => s === 1 ? '1st Semester' : s === 2 ? '2nd Semester' : s === 3 ? 'Summer' : 'None';
            formattedDetails = `${displayName} changed the current term to ${getSemesterName(newValues.current_sem)}`;
            break;

          // --- OTHER ---
          case 'PREREQ_OVERRIDE':
            formattedDetails = `${displayName} overrode prerequisites for ${newValues.course_code || `course #${newValues.course_id}`}`;
            break;
          case 'FACULTY_CREATED':
            formattedDetails = `${displayName} created user ${newValues.username || ''}`;
            break;
          case 'FACULTY_UPDATED':
            formattedDetails = `${displayName} updated user ${newValues.username || ''}`;
            break;
          
          default:
            // Clean fallback: "System Admin created a course"
            const cleanAction = formattedAction.replace(/_/g, ' ').toLowerCase();
            formattedDetails = newValues.details || `${displayName} ${cleanAction}`;
        }
      } else {
        // If there are no new_values, just say who did what
        const cleanAction = formattedAction.replace(/_/g, ' ').toLowerCase();
        formattedDetails = `${displayName} ${cleanAction}`;
      }
      
      let designation = item.designation_name;
      if (!designation || designation === 'Unknown') {
        if (item.roles && item.roles.includes('SUPERADMIN')) designation = 'Developer';
        else if (item.roles && item.roles.includes('ADMIN')) designation = 'Admin';
        else designation = 'Unknown';
      }

      return {
        log_id: item.id,
        user_id: item.user_id,
        username: displayName,
        designation,
        action: formattedAction,
        target_id: item.target_user_id,
        target_username: item.target_user_name || 'System',
        details: formattedDetails,
        timestamp: new Date(item.created_at).toLocaleString()
      };
    });

    res.json({ success: true, history: formattedHistory });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};