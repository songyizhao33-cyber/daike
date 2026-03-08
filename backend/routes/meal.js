const express = require('express');
const router = express.Router();
const MealAppointment = require('../models/MealAppointment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/auth');

// 创建约饭
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, mealTime, mealType, location, campus, note } = req.body;

    const appointment = new MealAppointment({
      userId: req.userId,
      date,
      mealTime,
      mealType,
      location,
      campus,
      note
    });

    await appointment.save();

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'create_meal',
      description: `发布约饭：${mealType} - ${location}`,
      relatedId: appointment._id,
      relatedModel: 'MealAppointment',
      metadata: { date, mealTime, campus }
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取所有约饭信息（浏览）- 智能排序
router.get('/browse', authMiddleware, async (req, res) => {
  try {
    const { date, campus, mealType } = req.query;

    const query = { status: 'active' };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (campus) {
      query.campus = campus;
    }

    if (mealType) {
      query.mealType = mealType;
    }

    const appointments = await MealAppointment.find(query)
      .populate('userId', 'username profile')
      .populate('interestedUsers.userId', 'username profile');

    // 智能排序：未过期的按时间从近到远，已过期的放最后
    const now = new Date();
    const sortedAppointments = appointments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // 判断是否过期
      const isExpiredA = dateA < now;
      const isExpiredB = dateB < now;

      // 未过期的排在前面
      if (isExpiredA && !isExpiredB) return 1;
      if (!isExpiredA && isExpiredB) return -1;

      // 同为未过期或同为已过期，按时间排序
      // 未过期的：从近到远（升序）
      // 已过期的：从近到远（降序，最近过期的在前）
      if (!isExpiredA && !isExpiredB) {
        return dateA - dateB; // 升序
      } else {
        return dateB - dateA; // 降序
      }
    });

    res.json(sortedAppointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取我的约饭
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const appointments = await MealAppointment.find({ userId: req.userId })
      .populate('interestedUsers.userId', 'username profile')
      .sort({ date: -1, mealTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取消约饭（标记为已取消）
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: '取消成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 删除约饭（永久删除）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    await MealAppointment.findByIdAndDelete(req.params.id);

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'delete_meal',
      description: '删除约饭信息',
      metadata: { appointmentId: req.params.id }
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 表达对约饭的兴趣（约一个）
router.post('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    if (appointment.status !== 'active') {
      return res.status(400).json({ message: '该约饭已取消' });
    }

    // 不能对自己的约饭表达兴趣
    if (appointment.userId.toString() === req.userId.toString()) {
      return res.status(400).json({ message: '不能对自己的约饭表达兴趣' });
    }

    // 检查是否已经表达过兴趣
    const alreadyInterested = appointment.interestedUsers.some(
      item => item.userId.toString() === req.userId.toString()
    );

    if (alreadyInterested) {
      return res.status(400).json({ message: '您已经表达过兴趣了' });
    }

    // 添加到感兴趣列表
    appointment.interestedUsers.push({
      userId: req.userId,
      expressedAt: new Date()
    });

    await appointment.save();

    // 创建通知
    await Notification.create({
      userId: appointment.userId,
      type: 'meal_interest',
      title: '有人对你的约饭感兴趣',
      content: '有人想和你一起吃饭，快去查看吧！',
      relatedId: appointment._id,
      fromUserId: req.userId
    });

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'express_meal_interest',
      description: '对约饭表达兴趣',
      relatedId: appointment._id,
      relatedModel: 'MealAppointment'
    });

    res.json({ message: '已表达兴趣' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取消对约饭的兴趣
router.delete('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    // 从感兴趣列表中移除
    appointment.interestedUsers = appointment.interestedUsers.filter(
      item => item.userId.toString() !== req.userId.toString()
    );

    await appointment.save();

    res.json({ message: '已取消兴趣' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
