// backend/db.js
// This file sets up the connection to our MySQL database.
const mysql = require('mysql2');
require('dotenv').config();

// Debugging: Log if environment variables are found
console.log('--- Database Configuration ---');
if (process.env.DATABASE_URL) {
    console.log('DB_SOURCE: DATABASE_URL (Connection String)');
} else {
    console.log('DB_HOST:', process.env.DB_HOST || 'localhost (default)');
    console.log('DB_USER:', process.env.DB_USER || 'root (default)');
    console.log('DB_NAME:', process.env.DB_NAME || 'online_exam (default)');
    if (!process.env.DB_PASSWORD) {
        console.warn('⚠️ WARNING: DB_PASSWORD is not set!');
    }
}
console.log('------------------------------');

// Create a connection pool
// We support both a single DATABASE_URL (common in cloud) or individual parameters
const pool = process.env.DATABASE_URL 
    ? mysql.createPool(process.env.DATABASE_URL)
    : mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'online_exam',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000 
    });


// We use the promise wrapper so we can use modern async/await syntax when querying the database.
const db = pool.promise();

// Function to test the database connection
const testConnection = async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed!');
        console.error('Error details:', err.message);
        return false;
    }
};

module.exports = {
    db,
    testConnection
};

