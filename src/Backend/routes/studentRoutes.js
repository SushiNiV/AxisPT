const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

router.post('/login', async (req, res) => {
  const { studentID, password, birthday, rememberMe } = req.body;
  try {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [studentID]);
      
    if (result.rows.length > 0) {
      const student = result.rows[0];
      const isMatch = await bcrypt.compare(password, student.password_hash);

      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

      const dbDate = new Date(student.birthday).toISOString().split('T')[0];
      if (dbDate !== birthday) {
          return res.status(401).json({ success: false, message: "Birthday verification failed" });
      }

      const expiresIn = rememberMe ? '7d' : '2h';
      const token = jwt.sign({ id: student.student_id, role: 'Student' }, process.env.JWT_SECRET, { expiresIn });

      res.json({ success: true, token, user: student.first_name, mustChangePassword: student.must_change_password });
    } else {
      res.status(404).json({ success: false, message: "Student not found" });
    }
  } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;