const express = require('express');
const router = express.Router();
const MealAppointment = require('../models/MealAppointment');
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
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取所有约饭信息（浏览）
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
      .sort({ date: 1, mealTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取我的约饭
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const appointments = await MealAppointment.find({ userId: req.userId })
      .sort({ date: -1, mealTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取消约饭
router.delete('/:id', authMiddleware, async (req, res) => {
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

module.exports = router;
