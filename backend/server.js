// backend/server.js
// Main entry point for the backend API server
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Connect the authentication routes
app.use('/api/auth', authRoutes);

// Connect the teacher protected routes
app.use('/api/teacher', teacherRoutes);

// Connect the student protected routes
app.use('/api/student', studentRoutes);

// Serve the frontend files statically
app.use('/', express.static(path.join(__dirname, '../frontend')));

// Health Check & Diagnostic Route
app.get('/api/status', async (req, res) => {
    const status = await initDatabase();
    if (status.success) {
        res.json({
            status: '🟢 Ready',
            database: 'Connected',
            tables: 'Verified/Created',
            message: 'Everything is working! You are ready for tonight.'
        });
    } else {
        res.status(500).json({
            status: '🔴 Issues Detected',
            error: status.error,
            tip: 'Check your DATABASE_URL in Render settings!'
        });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    // Auto-initialize database on startup
    await initDatabase();
});

