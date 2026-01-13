const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./database');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '192.168.0.62';

// 記憶體資料存儲
const memoryDB = db.getMemoryDB();

// 中介軟體
app.use(cors());
app.use(express.json());

// 1. 使用者註冊
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 檢查使用者是否已存在
    const existingUser = Object.values(memoryDB.users).find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: '使用者名稱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = memoryDB.userIdCounter++;
    
    memoryDB.users[userId] = {
      id: userId,
      username,
      password: hashedPassword,
      created_at: new Date()
    };

    res.json({ message: 'Register success' });
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({ message: '註冊失敗' });
  }
});

// 2. 使用者登入
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查詢使用者
    const user = Object.values(memoryDB.users).find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    res.json({
      message: 'Login success',
      user_id: user.id
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ message: '登入失敗' });
  }
});

// 3. 使用者登出
app.post('/logout', (req, res) => {
  res.json({ message: 'Logout success' });
});

// 4. 搶票成功率模擬
app.post('/simulate', async (req, res) => {
  try {
    const { platform, entry_time, ticket_type, network, user_id } = req.body;

    // 計算成功率規則
    const platformScores = {
      'ibon': 1.0,
      'KKTIX': 0.8,
      '拓元': 0.7
    };

    const entryTimeScores = {
      'early': 1.0,
      'ontime': 0.8,
      'late': 0.6
    };

    const ticketTypeScores = {
      '3800': 1.0,
      '4800': 0.8,
      '6800': 0.6
    };

    const networkScores = {
      'fast': 1.0,
      'normal': 0.8,
      'slow': 0.6
    };

    // 計算成功率
    const platformScore = (platformScores[platform] || 0) * 30;
    const entryTimeScore = (entryTimeScores[entry_time] || 0) * 25;
    const ticketTypeScore = (ticketTypeScores[ticket_type] || 0) * 25;
    const networkScore = (networkScores[network] || 0) * 20;

    const success_rate = Math.round(platformScore + entryTimeScore + ticketTypeScore + networkScore);

    // 生成建議
    let suggestion = '';
    if (success_rate >= 80) {
      suggestion = '您的設定非常好！繼續保持！';
    } else if (success_rate >= 60) {
      if (ticketTypeScore < 25) {
        suggestion = '建議改搶 3800 區';
      } else if (platformScore < 30) {
        suggestion = '建議改用 ibon 平台';
      } else if (networkScore < 20) {
        suggestion = '建議改用更快的網路';
      } else {
        suggestion = '建議提早進場';
      }
    } else {
      suggestion = '建議改搶 3800 區並提早進場，使用快速網路';
    }

    // 儲存到記憶體
    const strategyId = memoryDB.strategyIdCounter++;
    memoryDB.strategies[strategyId] = {
      id: strategyId,
      user_id,
      platform,
      entry_time,
      ticket_type,
      network,
      success_rate,
      suggestion,
      created_at: new Date().toISOString()
    };

    res.json({
      success_rate,
      suggestion
    });
  } catch (error) {
    console.error('模擬錯誤:', error);
    res.status(500).json({ message: '模擬失敗' });
  }
});

// 5. 查看歷史紀錄
app.get('/history', async (req, res) => {
  try {
    const { user_id } = req.query;

    const records = Object.values(memoryDB.strategies)
      .filter(s => s.user_id == user_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(records);
  } catch (error) {
    console.error('查詢歷史紀錄錯誤:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// 6. 生成 QR Code
app.post('/generate-qr', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: '缺少數據' });
    }

    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('生成 QR Code 錯誤:', error);
    res.status(500).json({ message: '生成 QR Code 失敗' });
  }
});

// 7. 生成票券 QR Code
app.post('/generate-ticket-qr', async (req, res) => {
  try {
    const { strategy_id, user_id, ticket_number } = req.body;
    
    if (!strategy_id || !user_id) {
      return res.status(400).json({ message: '缺少必要信息' });
    }

    const ticketData = JSON.stringify({
      strategy_id,
      user_id,
      ticket_number: ticket_number || Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    });

    const qrCodeDataUrl = await QRCode.toDataURL(ticketData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({ qrCode: qrCodeDataUrl, ticket_number: ticketData });
  } catch (error) {
    console.error('生成票券 QR Code 錯誤:', error);
    res.status(500).json({ message: '生成票券 QR Code 失敗' });
  }
});

// 啟動伺服器
app.listen(PORT, HOST, () => {
  console.log(`\n✅ 伺服器運行於 http://${HOST}:${PORT} (記憶體儲存模式)\n`);
  console.log(`🚀 前端連線地址: http://192.168.0.62:${PORT}\n`);
});
