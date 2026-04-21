// backend/server.js
// Main entry point for the backend API server
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, testConnection } = require('./db');
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

// Simple test route to verify the database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ 
            message: 'Database connected successfully!', 
            result: rows[0].solution 
        });
    } catch (error) {
        console.error('Database diagnostic route failed:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Test the database connection on startup
    console.log('Testing database connection...');
    await testConnection();
});

