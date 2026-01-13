const mysql = require('mysql2/promise');
require('dotenv').config();

// 建立資料庫連線池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ticket_simulator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// 測試連線
let dbConnected = false;

pool.getConnection()
  .then(connection => {
    console.log('✅ 資料庫連線成功！');
    dbConnected = true;
    connection.release();
  })
  .catch(err => {
    console.warn('⚠️ 資料庫連線失敗，將使用模擬模式:', err.message);
    dbConnected = false;
  });

// 匯出連線池和狀態
module.exports = pool;
module.exports.isConnected = () => dbConnected;
