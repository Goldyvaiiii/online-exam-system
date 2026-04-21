// backend/db.js
// This file sets up the connection to our PostgreSQL database.
const { Pool } = require('pg');
require('dotenv').config();

// Debugging: Log if environment variables are found
console.log('--- Database Configuration (Postgres) ---');
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
console.log('-----------------------------------------');

// Create a connection pool
// For PostgreSQL, SSL is almost always required in the cloud
const isCloud = !!process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If no DATABASE_URL, use individual params (for local dev)
    host: !isCloud ? (process.env.DB_HOST || 'localhost') : undefined,
    user: !isCloud ? (process.env.DB_USER || 'postgres') : undefined,
    password: !isCloud ? (process.env.DB_PASSWORD || '') : undefined,
    database: !isCloud ? (process.env.DB_NAME || 'online_exam') : undefined,
    port: !isCloud ? (process.env.DB_PORT || 5432) : undefined,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000 
});

// Function to test the database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully!');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL connection failed!');
        console.error('Error details:', err.message);
        return false;
    }
};

// For Postgres, we don't need .promise() because pg already returns promises for .query()
module.exports = {
    db: pool,
    testConnection
};


