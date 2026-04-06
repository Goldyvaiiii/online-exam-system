// backend/routes/authRoutes.js
// This file connects API URL paths to their specific controller functions

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Define the routes:
// POST /api/auth/register -> runs the 'register' function inside authController
router.post('/register', register);

// POST /api/auth/login -> runs the 'login' function inside authController
router.post('/login', login);

module.exports = router;
