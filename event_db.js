const mysql = require('mysql2');

// Create a database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456', // Please modify the password according to the MySQL configuration.
    database: 'charityevents_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Failed to connect to the database:' + err.stack);
        return;
    }
    console.log('The database has been connected. Connection ID: ' + connection.threadId);
    connection.release();
});

// Export the connection pool
module.exports = pool;