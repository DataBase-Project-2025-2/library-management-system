// 데이터베이스 연결 설정
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'ajou_library',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 연결 테스트
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL 데이터베이스 연결 실패:', err.message);
  });

module.exports = pool;
