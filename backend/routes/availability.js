const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Availability = require('../models/Availability');

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

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
