// backend/middleware/authMiddleware.js
// This file contains middleware functions to protect routes from unauthorized users.

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_key_123';

// Middleware to check if the user is logged in
const verifyToken = (req, res, next) => {
    // Tokens are usually sent by the frontend in the Authorization header like: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token validity against our secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded user data (id, role) to the request object so the next functions can use it!
        req.user = decoded;
        next(); // Move to the next function/controller
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Middleware to check if the logged-in user is specifically a teacher
const isTeacher = (req, res, next) => {
    // NOTE: This expects `verifyToken` to have run right before it!
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Only teachers can perform this action.' });
    }
};

module.exports = {
    verifyToken,
    isTeacher
};
