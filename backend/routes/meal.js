const express = require('express');
const router = express.Router();
const MealAppointment = require('../models/MealAppointment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const InteractionRecord = require('../models/InteractionRecord');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

function buildUserSnapshot(user) {
  return {
    userId: user._id,
    username: user.username,
    profile: {
      gender: user.profile?.gender || '',
      major: user.profile?.major || '',
      grade: user.profile?.grade || '',
      phone: user.profile?.phone || '',
      email: user.profile?.email || '',
      wechat: user.profile?.wechat || ''
    }
  };
}

async function sanitizeAppointments(appointments) {
  const validAppointments = [];
  const cleanupTasks = [];

  for (const appointment of appointments) {
    if (!appointment.userId) {
      cleanupTasks.push(MealAppointment.findByIdAndDelete(appointment._id));
      cleanupTasks.push(
        InteractionRecord.deleteMany({
          relatedModel: 'MealAppointment',
          relatedId: appointment._id
        })
      );
      cleanupTasks.push(Notification.deleteMany({ relatedId: appointment._id }));
      continue;
    }

    const validInterestedUsers = (appointment.interestedUsers || []).filter(item => item.userId);
    if (validInterestedUsers.length !== (appointment.interestedUsers || []).length) {
      appointment.interestedUsers = validInterestedUsers;
      cleanupTasks.push(appointment.save());
    }

    validAppointments.push(appointment);
  }

  if (cleanupTasks.length > 0) {
    await Promise.all(cleanupTasks);
  }

  return validAppointments;
}

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

    await ActivityLog.create({
      userId: req.userId,
      actionType: 'create_meal',
      description: `发布约饭：${mealType} ${mealTime} ${location}`,
      relatedId: appointment._id,
      relatedModel: 'MealAppointment',
      metadata: { date, mealTime, campus }
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

    if (campus) query.campus = campus;
    if (mealType) query.mealType = mealType;

    let appointments = await MealAppointment.find(query)
      .populate('userId', 'username profile')
      .populate('interestedUsers.userId', 'username profile');

    appointments = await sanitizeAppointments(appointments);

    const now = new Date();
    appointments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const expiredA = dateA < now;
      const expiredB = dateB < now;

      if (expiredA && !expiredB) return 1;
      if (!expiredA && expiredB) return -1;
      return expiredA ? dateB - dateA : dateA - dateB;
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    let appointments = await MealAppointment.find({ userId: req.userId })
      .populate('interestedUsers.userId', 'username profile')
      .sort({ date: -1, mealTime: 1 });

    appointments = await sanitizeAppointments(appointments);

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    await Promise.all([
      appointment.save(),
      InteractionRecord.updateMany(
        { relatedModel: 'MealAppointment', relatedId: appointment._id },
        { status: 'cancelled' }
      )
    ]);

    res.json({ message: '取消成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    await Promise.all([
      MealAppointment.findByIdAndDelete(req.params.id),
      InteractionRecord.updateMany(
        { relatedModel: 'MealAppointment', relatedId: req.params.id },
        { status: 'cancelled' }
      ),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'delete_meal',
        description: '删除约饭信息',
        metadata: { appointmentId: req.params.id }
      })
    ]);

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    if (appointment.status !== 'active') {
      return res.status(400).json({ message: '该约饭已取消' });
    }

    if (appointment.userId.toString() === req.userId.toString()) {
      return res.status(400).json({ message: '不能对自己的约饭点击“约一下”' });
    }

    const alreadyInterested = appointment.interestedUsers.some(
      item => item.userId.toString() === req.userId.toString()
    );

    if (alreadyInterested) {
      return res.status(400).json({ message: '你已经点击过“约一下”了' });
    }

    const [publisher, interestedUser] = await Promise.all([
      User.findById(appointment.userId),
      User.findById(req.userId)
    ]);

    if (!publisher) {
      await Promise.all([
        MealAppointment.findByIdAndDelete(appointment._id),
        InteractionRecord.deleteMany({ relatedModel: 'MealAppointment', relatedId: appointment._id }),
        Notification.deleteMany({ relatedId: appointment._id })
      ]);
      return res.status(404).json({ message: '该约饭发布者已不存在，记录已清理' });
    }

    appointment.interestedUsers.push({
      userId: req.userId,
      expressedAt: new Date()
    });

    const publisherSnapshot = buildUserSnapshot(publisher);
    const interestedSnapshot = buildUserSnapshot(interestedUser);
    const context = {
      date: appointment.date,
      mealTime: appointment.mealTime,
      mealType: appointment.mealType,
      location: appointment.location,
      campus: appointment.campus,
      note: appointment.note || ''
    };

    await Promise.all([
      appointment.save(),
      InteractionRecord.create({
        category: 'meal',
        actionType: 'meal_interest',
        sourceUserId: interestedUser._id,
        targetUserId: publisher._id,
        relatedModel: 'MealAppointment',
        relatedId: appointment._id,
        sourceSnapshot: interestedSnapshot,
        targetSnapshot: publisherSnapshot,
        context
      }),
      Notification.create({
        userId: publisher._id,
        type: 'meal_interest',
        title: '有人点击了你的约饭',
        content: `${interestedUser.username} 想和你一起吃饭，双方联系方式已经开放。`,
        relatedId: appointment._id,
        fromUserId: interestedUser._id,
        payload: {
          category: 'meal',
          publisher: publisherSnapshot,
          interestedUser: interestedSnapshot,
          context
        }
      }),
      Notification.create({
        userId: interestedUser._id,
        type: 'meal_interest',
        title: '已获取约饭对象信息',
        content: `你已点击 ${publisher.username} 的约饭信息，请尽快联系对方。`,
        relatedId: appointment._id,
        fromUserId: publisher._id,
        payload: {
          category: 'meal',
          publisher: publisherSnapshot,
          interestedUser: interestedSnapshot,
          context
        }
      }),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'express_meal_interest',
        description: `点击约饭：${appointment.location} ${appointment.mealTime}`,
        relatedId: appointment._id,
        relatedModel: 'MealAppointment'
      })
    ]);

    res.json({
      message: '已成功约一下',
      publisher: publisherSnapshot,
      interestedUser: interestedSnapshot,
      context
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id/interest', authMiddleware, async (req, res) => {
  try {
    const appointment = await MealAppointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: '约饭信息不存在' });
    }

    appointment.interestedUsers = appointment.interestedUsers.filter(
      item => item.userId.toString() !== req.userId.toString()
    );

    await Promise.all([
      appointment.save(),
      InteractionRecord.updateMany(
        {
          relatedModel: 'MealAppointment',
          relatedId: appointment._id,
          sourceUserId: req.userId
        },
        { status: 'cancelled' }
      )
    ]);

    res.json({ message: '已取消兴趣' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
