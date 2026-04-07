// backend/server.js
// Main entry point for the backend API server
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
require('dotenv').config();

const app = express();

// Middleware
// Enable CORS so our frontend HTML files can communicate with this backend without security errors
app.use(cors()); 
// Allows Express to automatically parse incoming JSON data from requests
app.use(express.json()); 

// Connect the authentication routes
// Now all endpoints inside authRoutes are prefixed with '/api/auth'
app.use('/api/auth', authRoutes);

// Connect the teacher protected routes
app.use('/api/teacher', teacherRoutes);

// Connect the student protected routes
app.use('/api/student', studentRoutes);

// Serve the frontend files statically so everything is easily accessible on port 5000!
app.use('/', express.static(path.join(__dirname, '../frontend')));

// Simple test route to verify the database connection
// We use async/await here because database operations take time
app.get('/api/test-db', async (req, res) => {
    try {
        // Run a simple query to see if MySQL is responding
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        
        // Send a JSON response back to the client
        res.json({ 
            message: 'Database connected successfully!', 
            result: rows[0].solution 
        });
    } catch (error) {
        // NOTE: Always use try-catch blocks for database calls to prevent the whole server from crashing if DB is offline.
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
