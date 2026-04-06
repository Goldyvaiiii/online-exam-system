// backend/db.js
// This file sets up the connection to our MySQL database.
const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool instead of a single database connection.
// A pool is better because it efficiently handles multiple user requests at the same time.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'online_exam',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// We use the promise wrapper so we can use modern async/await syntax when querying the database.
// NOTE: Beginner tip - without .promise(), you would be stuck using messy callback functions!
const db = pool.promise();

module.exports = db;
