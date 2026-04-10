const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const saltRounds = 10;

router.post('/login', async (req, res) => {
    const { employeeID, password, rememberMe } = req.body;
    try {
        const result = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
            const isMatch = isBcrypt ? await bcrypt.compare(password, user.password_hash) : (password === user.password_hash);

            if (isMatch) {
                const expiresIn = rememberMe ? '7d' : '2h';
                const token = jwt.sign(
                    { id: user.employee_id, role: 'Admin' }, 
                    process.env.JWT_SECRET, 
                    { expiresIn }
                );

                await pool.query(
                    'INSERT INTO history_transactions (admin_id, admin_role, action, target_id, details) VALUES ($1, $2, $3, $4, $5)',
                    [user.employee_id, 'Admin', 'LOGIN', user.employee_id, 'Successful login']
                );

                res.json({ 
                    success: true, 
                    token, 
                    user: user.first_name, 
                    mustChangePassword: user.must_change_password 
                });
            } else {
                res.status(401).json({ success: false, message: "Invalid credentials" });
            }
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error("DEBUG LOGIN ERROR:", err); 
    // This will send the ACTUAL error (like "relation administrators does not exist") to your console
    res.status(500).json({ success: false, message: err.message });   
    }
});

router.post('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const employeeID = req.user.id;

    try {
        const userResult = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) return res.status(401).json({ success: false, message: "Current password incorrect" });

        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        await pool.query(
            'UPDATE administrators SET password_hash = $1, must_change_password = false WHERE employee_id = $2', 
            [hashedNewPassword, employeeID]
        );

        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;