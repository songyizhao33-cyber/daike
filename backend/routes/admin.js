const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const adminAuthMiddleware = require('../middleware/adminAuth');
const User = require('../models/User');
const Availability = require('../models/Availability');
const MatchRequest = require('../models/MatchRequest');
const MealAppointment = require('../models/MealAppointment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const Review = require('../models/Review');
const InteractionRecord = require('../models/InteractionRecord');

function toPage(value, fallback = 1) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toLimit(value, fallback = 20, max = 100) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function cleanupUserTraces(userId) {
  await Promise.all([
    Availability.deleteMany({ userId }),
    MatchRequest.deleteMany({ requesterId: userId }),
    MealAppointment.deleteMany({ userId }),
    InteractionRecord.deleteMany({
      $or: [{ sourceUserId: userId }, { targetUserId: userId }]
    }),
    ActivityLog.deleteMany({ userId }),
    Notification.deleteMany({ $or: [{ userId }, { fromUserId: userId }] }),
    Feedback.deleteMany({ userId }),
    Review.deleteMany({ userId })
  ]);

  await Promise.all([
    MatchRequest.updateMany(
      { 'matchedSubstitutes.userId': userId },
      { $pull: { matchedSubstitutes: { userId } } }
    ),
    MatchRequest.updateMany(
      { 'viewedBySubstitutes.userId': userId },
      { $pull: { viewedBySubstitutes: { userId } } }
    ),
    MatchRequest.updateMany(
      { selectedSubstitute: userId },
      { $unset: { selectedSubstitute: 1 }, $set: { status: 'pending' } }
    ),
    MealAppointment.updateMany(
      { 'interestedUsers.userId': userId },
      { $pull: { interestedUsers: { userId } } }
    )
  ]);
}

router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const page = toPage(req.query.page);
    const limit = toLimit(req.query.limit);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query = {};

    if (search) {
      const safe = escapeRegex(search.slice(0, 50));
      query.$or = [
        { username: { $regex: safe, $options: 'i' } },
        { 'profile.email': { $regex: safe, $options: 'i' } },
        { 'profile.wechat': { $regex: safe, $options: 'i' } }
      ];
    }

    const [users, count] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      User.countDocuments(query)
    ]);

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

router.get('/users/:id', adminAuthMiddleware, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: '无效的用户 ID' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const [availabilityCount, matchRequestCount, mealAppointmentCount, interactionCount] = await Promise.all([
      Availability.countDocuments({ userId: req.params.id }),
      MatchRequest.countDocuments({ requesterId: req.params.id }),
      MealAppointment.countDocuments({ userId: req.params.id }),
      InteractionRecord.countDocuments({
        $or: [{ sourceUserId: req.params.id }, { targetUserId: req.params.id }]
      })
    ]);

    res.json({
      user,
      stats: { availabilityCount, matchRequestCount, mealAppointmentCount, interactionCount }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/users/:id/activity-log', adminAuthMiddleware, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: '无效的用户 ID' });
    }

    const page = toPage(req.query.page);
    const limit = toLimit(req.query.limit);
    const query = { userId: req.params.id };
    if (req.query.actionType) query.actionType = req.query.actionType;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/users/:id/content-history', adminAuthMiddleware, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: '无效的用户 ID' });
    }

    const [availabilities, matchRequests, mealAppointments, interactions] = await Promise.all([
      Availability.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      MatchRequest.find({ requesterId: req.params.id })
        .populate('matchedSubstitutes.userId', 'username profile')
        .populate('selectedSubstitute', 'username profile')
        .sort({ createdAt: -1 })
        .limit(10),
      MealAppointment.find({ userId: req.params.id })
        .populate('interestedUsers.userId', 'username profile')
        .sort({ createdAt: -1 })
        .limit(10),
      InteractionRecord.find({
        $or: [{ sourceUserId: req.params.id }, { targetUserId: req.params.id }]
      })
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    res.json({ availabilities, matchRequests, mealAppointments, interactions });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/users/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: '无效的用户 ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能删除管理员账号' });
    }

    await cleanupUserTraces(id);
    await User.findByIdAndDelete(id);

    await ActivityLog.create({
      userId: req.userId,
      actionType: 'admin_delete_user',
      description: `管理员删除用户：${user.username}`,
      metadata: { deletedUserId: id, deletedUsername: user.username }
    });

    res.json({ message: '用户已删除，关联历史记录已清理' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalAvailabilities,
      totalMatchRequests,
      totalMealAppointments,
      totalInteractions,
      newUsersLast7Days
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Availability.countDocuments(),
      MatchRequest.countDocuments(),
      MealAppointment.countDocuments(),
      InteractionRecord.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, role: { $ne: 'admin' } })
    ]);

    res.json({
      totalUsers,
      totalAvailabilities,
      totalMatchRequests,
      totalMealAppointments,
      totalInteractions,
      newUsersLast7Days
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/overview/availabilities', adminAuthMiddleware, async (req, res) => {
  try {
    const page = toPage(req.query.page);
    const limit = toLimit(req.query.limit, 15, 50);
    const query = {};

    if (req.query.dayOfWeek) query.dayOfWeek = Number.parseInt(req.query.dayOfWeek, 10);
    if (req.query.campus) query.campuses = req.query.campus;

    const [items, total] = await Promise.all([
      Availability.find(query)
        .populate('userId', 'username profile.major profile.grade profile.email profile.wechat profile.phone')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Availability.countDocuments(query)
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/overview/match-requests', adminAuthMiddleware, async (req, res) => {
  try {
    const page = toPage(req.query.page);
    const limit = toLimit(req.query.limit, 15, 50);
    const query = {};

    if (req.query.status) query.status = req.query.status;

    const [items, total] = await Promise.all([
      MatchRequest.find(query)
        .populate('requesterId', 'username profile')
        .populate('selectedSubstitute', 'username profile')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      MatchRequest.countDocuments(query)
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/overview/match-requests/:id', adminAuthMiddleware, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: '无效的代课需求 ID' });
    }

    const matchRequest = await MatchRequest.findById(req.params.id)
      .populate('requesterId', 'username profile')
      .populate('matchedSubstitutes.userId', 'username profile')
      .populate('selectedSubstitute', 'username profile');

    if (!matchRequest) {
      return res.status(404).json({ message: '代课需求不存在' });
    }

    const interactions = await InteractionRecord.find({
      relatedModel: 'MatchRequest',
      relatedId: req.params.id
    }).sort({ createdAt: -1 });

    res.json({ matchRequest, interactions });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/overview/meal-appointments', adminAuthMiddleware, async (req, res) => {
  try {
    const page = toPage(req.query.page);
    const limit = toLimit(req.query.limit, 15, 50);
    const query = {};

    if (req.query.status) query.status = req.query.status;

    const [items, total] = await Promise.all([
      MealAppointment.find(query)
        .populate('userId', 'username profile')
        .populate('interestedUsers.userId', 'username profile')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      MealAppointment.countDocuments(query)
    ]);

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/overview/meal-appointments/:id', adminAuthMiddleware, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: '无效的约饭 ID' });
    }

    const mealAppointment = await MealAppointment.findById(req.params.id)
      .populate('userId', 'username profile')
      .populate('interestedUsers.userId', 'username profile');

    if (!mealAppointment) {
      return res.status(404).json({ message: '约饭记录不存在' });
    }

    const interactions = await InteractionRecord.find({
      relatedModel: 'MealAppointment',
      relatedId: req.params.id
    }).sort({ createdAt: -1 });

    res.json({ mealAppointment, interactions });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/match-requests/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: '无效的代课需求 ID' });
    }

    const target = await MatchRequest.findByIdAndDelete(id);
    if (!target) {
      return res.status(404).json({ message: '代课需求不存在' });
    }

    await Promise.all([
      Notification.deleteMany({ relatedId: id }),
      InteractionRecord.deleteMany({ relatedModel: 'MatchRequest', relatedId: id }),
      ActivityLog.deleteMany({ relatedId: id, relatedModel: 'MatchRequest' }),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'admin_delete_match_request',
        description: `管理员删除代课需求：${id}`,
        metadata: { matchRequestId: id }
      })
    ]);

    res.json({ message: '代课需求已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/meal-appointments/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: '无效的约饭 ID' });
    }

    const target = await MealAppointment.findByIdAndDelete(id);
    if (!target) {
      return res.status(404).json({ message: '约饭记录不存在' });
    }

    await Promise.all([
      Notification.deleteMany({ relatedId: id }),
      InteractionRecord.deleteMany({ relatedModel: 'MealAppointment', relatedId: id }),
      ActivityLog.deleteMany({ relatedId: id, relatedModel: 'MealAppointment' }),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'admin_delete_meal',
        description: `管理员删除约饭记录：${id}`,
        metadata: { mealAppointmentId: id }
      })
    ]);

    res.json({ message: '约饭记录已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
