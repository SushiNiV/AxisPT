const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.post('/api/login', async (req, res) => {
    const { employeeID, password } = req.body;
    
    try {   
        const result = await pool.query(
            'SELECT * FROM administrators WHERE employee_id = $1', 
            [employeeID]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            if (user.password_hash === password) {
                // LOGGING THE TRANSACTION
                // We do this before sending the response to ensure the action is recorded
                await pool.query(
                    `INSERT INTO history_transactions 
                    (admin_id, admin_role, action, target_id, details) 
                    VALUES ($1, $2, $3, $4, $5)`,
                    [
                        user.employee_id, 
                        user.role || 'Admin', // Uses role from DB or defaults to 'Admin'
                        'LOGIN', 
                        user.employee_id, 
                        `Successful login via Administrative Axis Portal.`
                    ]
                );

                res.json({ 
                    success: true, 
                    message: "Login successful", 
                    user: user.first_name,
                    mustChangePassword: user.must_change_password // Helpful for your "Bank Style" flow
                });
            } else {
                await pool.query(
                    'INSERT INTO history_transactions (admin_id, action, details) VALUES ($1, $2, $3)',
                    [employeeID, 'LOGIN_FAIL', 'Incorrect password attempt.']
                );
                res.status(401).json({ success: false, message: "Invalid password" });
            }
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));