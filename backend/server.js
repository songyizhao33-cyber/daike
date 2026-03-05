const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const availabilityRoutes = require('./routes/availability');
const matchRoutes = require('./routes/match');

const app = express();

// CORS 配置 - 简化配置，提高兼容性
app.use(cors({
  origin: function(origin, callback) {
    // 允许的来源列表
    const allowedOrigins = [
      'https://daike-1.onrender.com',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

    // 允许没有 origin 的请求（如 Postman、curl）
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: false, // 改为 false，简化 CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // 某些浏览器对 204 处理有问题
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err));

app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/match', matchRoutes);

app.get('/', (req, res) => {
  res.json({ message: '代课匹配系统 API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});