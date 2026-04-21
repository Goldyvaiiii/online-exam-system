// backend/controllers/authController.js
// This file handles the logic for user registration and login

const { db } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// A secret key used to sign JWT tokens.
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_key_123';

// @desc    Register a new user (Teacher or Student)
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        // Postgres uses $1, $2 for placeholders
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Postgres doesn't have insertId; we use RETURNING id to get it back
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'User registered successfully!', userId: result.rows[0].id });
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ 
            error: 'Server error during registration', 
            details: error.message 
        });
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

        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

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
        console.error('Login Error:', error.message);
        res.status(500).json({ 
            error: 'Server error during login', 
            details: error.message 
        });
    }
};

module.exports = {
    register,
    login
};

