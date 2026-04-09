const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const saltRounds = 10;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ success: false, message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: "Unauthorized access" });
        req.user = decoded;
        next();
    });
};

app.post('/api/login', async (req, res) => {
    const { employeeID, password, rememberMe } = req.body;
    try {
        const result = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPass = user.password_hash;
            
            const isBcrypt = storedPass.startsWith('$2b$') || storedPass.startsWith('$2a$');
            const isMatch = isBcrypt 
                ? await bcrypt.compare(password, storedPass) 
                : (password === storedPass);

            if (isMatch) {
                const token = jwt.sign(
                    { id: user.employee_id, role: user.role || 'Admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '2h' }
                );

                await pool.query(
                    `INSERT INTO history_transactions (admin_id, admin_role, action, target_id, details) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [user.employee_id, user.role || 'Admin', 'LOGIN', user.employee_id, 'Successful login']
                );

                if (isMatch) {
                const expiresIn = rememberMe ? '7d' : '2h';

                const token = jwt.sign(
                    { id: user.employee_id, role: user.role || 'Admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: expiresIn }
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
    }} catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.post('/api/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const employeeID = req.user.id;

    try {
        const userResult = await pool.query('SELECT * FROM administrators WHERE employee_id = $1', [employeeID]);
        const user = userResult.rows[0];

        const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
        const isMatch = isBcrypt 
            ? await bcrypt.compare(currentPassword, user.password_hash) 
            : (currentPassword === user.password_hash);

        if (!isMatch) {
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
            [user.employee_id, user.role || 'Admin', 'PASSWORD_CHANGE', user.employee_id, 'Password updated and hashed']
        );

        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));