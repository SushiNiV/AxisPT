const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const saltRounds = 10;

app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// LOGIN ENDPOINT
// UPDATED LOGIN ENDPOINT FOR HYBRID PASSWORDS
app.post('/api/login', async (req, res) => {
    const { employeeID, password } = req.body;
    try {   
        const result = await pool.query(
            'SELECT * FROM administrators WHERE employee_id = $1', 
            [employeeID]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPass = user.password_hash;
            let isMatch = false;

            // Check if the stored password looks like a bcrypt hash 
            // (Bcrypt hashes usually start with $2b$ or $2a$)
            if (storedPass.startsWith('$2b$') || storedPass.startsWith('$2a$')) {
                isMatch = await bcrypt.compare(password, storedPass);
            } else {
                // FALLBACK: Plain text comparison for first-time users
                isMatch = (password === storedPass);
            }

            if (isMatch) {
                res.json({ 
                    success: true, 
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
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// CHANGE PASSWORD ENDPOINT
app.post('/api/change-password', async (req, res) => {
    const { employeeID, currentPassword, newPassword } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        const isPlainTextMatch = (currentPassword === user.password_hash);

        if (!isMatch && !isPlainTextMatch) {
            return res.status(401).json({ success: false, message: "Current password incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            'UPDATE administrators SET password_hash = $1, must_change_password = false WHERE employee_id = $2',
            [hashedNewPassword, employeeID]
        );

        await pool.query(
            `INSERT INTO history_transactions (admin_id, admin_role, action, target_id, details) 
             VALUES ($1, $2, $3, $4, $5)`,
            [user.employee_id, user.role || 'Admin', 'PASSWORD_CHANGE', user.employee_id, 'Admin updated password.']
        );

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        console.error("Change password error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});