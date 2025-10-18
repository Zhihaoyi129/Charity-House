const mysql = require('mysql2');

// 创建数据库连接池（推荐使用连接池）
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456', // 请根据您的MySQL配置修改密码
    database: 'charityevents_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
pool.getConnection((err, connection) => {
    if (err) {
        console.error('连接数据库失败: ' + err.stack);
        return;
    }
    console.log('已连接到数据库，连接ID: ' + connection.threadId);
    connection.release();
});

// 导出连接池
module.exports = pool;