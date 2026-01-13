// 純記憶體存儲模式
require('dotenv').config();

// 模擬資料庫 - 使用記憶體存儲
const memoryDB = {
  users: {},
  strategies: {},
  userIdCounter: 1,
  strategyIdCounter: 1
};

// 匯出簡單的查詢介面
module.exports = {
  query: async (sql, params) => {
    // 此函數不再使用，保留用於兼容性
    return [[], []];
  },
  getMemoryDB: () => memoryDB,
  isConnected: () => false // 總是使用記憶體模式
};
