const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, profile } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 验证微信号或邮箱至少填写一项
    if (!profile?.wechat && !profile?.email) {
      return res.status(400).json({ message: '微信号和邮箱至少需要填写一项' });
    }

    // 验证角色
    const validRoles = ['substitute', 'requester', 'both'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: '无效的角色类型' });
    }

    // 前端发送的是SHA256哈希值，后端使用bcrypt加盐哈希存储
    const hashedPassword = await bcrypt.hash(password, 10);

    // 清理 profile 数据，移除空字符串
    const cleanProfile = {};
    if (profile) {
      if (profile.gender) cleanProfile.gender = profile.gender;
      if (profile.major) cleanProfile.major = profile.major;
      if (profile.grade) cleanProfile.grade = profile.grade;
      if (profile.phone) cleanProfile.phone = profile.phone;
      if (profile.wechat) cleanProfile.wechat = profile.wechat;
      if (profile.email) cleanProfile.email = profile.email;
    }

    const user = new User({
      username,
      password: hashedPassword,
      role: role || 'both',
      profile: cleanProfile
    });

    await user.save();

    // 记录活动日志
    await ActivityLog.create({
      userId: user._id,
      actionType: 'register',
      description: '用户注册',
      metadata: { username, role: user.role }
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 前端发送的是SHA256哈希值，后端再次使用bcrypt验证
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 记录活动日志
    await ActivityLog.create({
      userId: user._id,
      actionType: 'login',
      description: '用户登录'
    });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新个人信息
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { role, profile } = req.body;

    // 验证微信号或邮箱至少填写一项
    if (!profile?.wechat && !profile?.email) {
      return res.status(400).json({ message: '微信号和邮箱至少需要填写一项' });
    }

    // 清理 profile 数据
    const cleanProfile = {};
    if (profile.gender) cleanProfile.gender = profile.gender;
    if (profile.major) cleanProfile.major = profile.major;
    if (profile.grade) cleanProfile.grade = profile.grade;
    if (profile.phone) cleanProfile.phone = profile.phone;
    if (profile.wechat) cleanProfile.wechat = profile.wechat;
    if (profile.email) cleanProfile.email = profile.email;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        role: role || 'both',
        profile: cleanProfile
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 记录活动日志
    await ActivityLog.create({
      userId,
      actionType: 'update_profile',
      description: '更新个人信息',
      metadata: { role: user.role }
    });

    res.json({
      message: '更新成功',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 用户注销账号
router.delete('/account', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 删除用户相关的所有数据
    const Availability = require('../models/Availability');
    const MatchRequest = require('../models/MatchRequest');
    const MealAppointment = require('../models/MealAppointment');
    const Notification = require('../models/Notification');

    await Availability.deleteMany({ userId });
    await MatchRequest.deleteMany({ requesterId: userId });
    await MealAppointment.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await ActivityLog.deleteMany({ userId });

    // 记录删除账号日志（在删除前）
    await ActivityLog.create({
      userId,
      actionType: 'delete_account',
      description: '用户注销账号'
    });

    await User.findByIdAndDelete(userId);

    res.json({ message: '账号已注销' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取用户自己的活动历史记录
router.get('/activity-log', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType } = req.query;

    const query = { userId: req.userId };
    if (actionType) {
      query.actionType = actionType;
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
