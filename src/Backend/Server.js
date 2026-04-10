const express = require('express');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Production server running on port ${PORT}`));