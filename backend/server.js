const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const availabilityRoutes = require('./routes/availability');
const matchRoutes = require('./routes/match');

const app = express();

// 关键修改：配置CORS，仅允许你的前端URL访问
app.use(cors({
  origin: [
    'https://daike-1.onrender.com', // 你的前端线上URL
    'http://localhost:5173', // 本地开发前端地址（可选，方便本地调试）
    'http://127.0.0.1:5173'
  ],
  credentials: true, // 允许携带cookie（如果需要）
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的请求方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
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