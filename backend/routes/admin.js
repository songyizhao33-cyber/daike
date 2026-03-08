const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuth');
const User = require('../models/User');
const Availability = require('../models/Availability');
const MatchRequest = require('../models/MatchRequest');
const MealAppointment = require('../models/MealAppointment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// 获取所有用户列表
router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取用户详细信息
router.get('/users/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 获取用户相关数据统计
    const availabilityCount = await Availability.countDocuments({ userId: req.params.id });
    const matchRequestCount = await MatchRequest.countDocuments({ requesterId: req.params.id });
    const mealAppointmentCount = await MealAppointment.countDocuments({ userId: req.params.id });

    res.json({
      user,
      stats: {
        availabilityCount,
        matchRequestCount,
        mealAppointmentCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取用户的活动历史记录（管理员）
router.get('/users/:id/activity-log', adminAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType } = req.query;

    const query = { userId: req.params.id };
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

// 获取用户的发布内容历史（管理员）
router.get('/users/:id/content-history', adminAuthMiddleware, async (req, res) => {
  try {
    const availabilities = await Availability.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const matchRequests = await MatchRequest.find({ requesterId: req.params.id })
      .populate('matchedSubstitutes.userId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    const mealAppointments = await MealAppointment.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      availabilities,
      matchRequests,
      mealAppointments
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 删除用户账号
router.delete('/users/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能删除管理员账号' });
    }

    // 删除用户相关的所有数据
    await Availability.deleteMany({ userId: req.params.id });
    await MatchRequest.deleteMany({ requesterId: req.params.id });
    await MealAppointment.deleteMany({ userId: req.params.id });
    await ActivityLog.deleteMany({ userId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取平台统计数据
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalAvailabilities = await Availability.countDocuments();
    const totalMatchRequests = await MatchRequest.countDocuments();
    const totalMealAppointments = await MealAppointment.countDocuments();

    // 最近7天新增用户
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      role: { $ne: 'admin' }
    });

    res.json({
      totalUsers,
      totalAvailabilities,
      totalMatchRequests,
      totalMealAppointments,
      newUsersLast7Days
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;

