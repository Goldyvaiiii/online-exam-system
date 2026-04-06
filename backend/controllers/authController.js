// backend/controllers/authController.js
// This file handles the logic for user registration and login

const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// A secret key used to sign JWT tokens. In a real production app, keep this VERY secret in process.env!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_key_123';

// @desc    Register a new user (Teacher or Student)
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic validation: make sure everything is provided by the frontend
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        // NOTE: Before creating a user, we check if the email already exists in the database.
        // It's a common beginner mistake to forget this and end up with duplicate accounts!
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash the password securely so even if the database is hacked, passwords are unreadable
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// @desc    Login user and send a JWT token back
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Find the user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        // If the 'users' array is empty, no such user exists in our DB
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Compare the submitted password with the securely hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create a JWT token. The token contains the user's ID and role securely encoded.
        // It expires in 1 day (24 hours). This token is their "passport" to access protected routes.
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Send back the token and some basic user info (excluding password!)
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

module.exports = {
    register,
    login
};
