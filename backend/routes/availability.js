const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Availability = require('../models/Availability');
const ActivityLog = require('../models/ActivityLog');
const MatchRequest = require('../models/MatchRequest');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dayOfWeek, periods, isRecurring, campuses, frequencyType } = req.body;

    const availability = new Availability({
      userId: req.userId,
      dayOfWeek,
      periods,
      isRecurring,
      campuses,
      frequencyType
    });

    await availability.save();

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'create_availability',
      description: `添加空闲时间：星期${dayOfWeek}，${periods.length}节课`,
      relatedId: availability._id,
      relatedModel: 'Availability',
      metadata: { dayOfWeek, periods, campuses, frequencyType }
    });

    res.status(201).json({
      message: '空闲时间添加成功',
      availability
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const availabilities = await Availability.find({ userId: req.userId })
      .sort({ dayOfWeek: 1 });

    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/all', authMiddleware, async (req, res) => {
  try {
    await Availability.deleteMany({ userId: req.userId });
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const availability = await Availability.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!availability) {
      return res.status(404).json({ message: '未找到该空闲时间' });
    }

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'delete_availability',
      description: '删除空闲时间',
      metadata: { availabilityId: req.params.id }
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 查看谁选择了我（代课者查看被选中的记录）
router.get('/selected-me', authMiddleware, async (req, res) => {
  try {
    const selectedRequests = await MatchRequest.find({
      selectedSubstitute: req.userId
    })
      .populate('requesterId', 'username profile')
      .sort({ createdAt: -1 });

    res.json(selectedRequests);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
