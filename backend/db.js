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

const fs = require('fs');
const path = require('path');

// Function to test the database connection and auto-initialize tables
const initDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully!');
        
        // Check if tables already exist (by looking for 'users' table)
        const checkTableQuery = "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'";
        const tableCheck = await client.query(checkTableQuery);

        if (tableCheck.rows.length === 0) {
            console.log('🚀 Database is empty. Running schema.sql to initialize tables...');
            const schemaPath = path.join(__dirname, '../schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            // Execute the schema (Postgres can run multiple statements separated by ;)
            await client.query(schemaSql);
            console.log('✨ Database tables and sample data initialized!');
        } else {
            console.log('📚 Database tables already exist.');
        }

        client.release();
        return { success: true, message: 'Connected & Initialized' };
    } catch (err) {
        console.error('❌ Database Initialization Failed!');
        console.error('Error details:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = {
    db: pool,
    initDatabase
};



