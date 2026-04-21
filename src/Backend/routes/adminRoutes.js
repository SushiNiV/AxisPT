const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const { verifyToken } = require('../middleware/auth');

router.post('/change-password', verifyToken, async (req, res) => {
  const { employeeID, currentPassword, newPassword } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
            
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];
    let isMatch = false;

    if (user.must_change_password) {
      isMatch = (currentPassword === user.password_hash);
    } else {
      isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      'UPDATE administrators SET password_hash = $1, must_change_password = false WHERE employee_id = $2',
      [hashedNewPassword, employeeID]
    );

    await pool.query(
      `INSERT INTO history_transactions 
      (user_id, user_role, user_designation, action, target_id, details) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.employee_id, 
        user.role, 
        user.designation, 
        'PASSWORD_CHANGE', 
        user.employee_id, 
        `${user.designation} updated their own password.`
      ]
    );

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/login', adminController.login);
router.get('/pending-students', verifyToken, adminController.getPendingStudents);

module.exports = router;