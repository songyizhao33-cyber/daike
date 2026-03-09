const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MatchRequest = require('../models/MatchRequest');
const Availability = require('../models/Availability');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const InteractionRecord = require('../models/InteractionRecord');
const User = require('../models/User');

const requestLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId.toString();
  const userRequests = requestLimits.get(key) || [];
  const recentRequests = userRequests.filter(time => now - time < 3600000);

  if (recentRequests.length >= 10) {
    return false;
  }

  recentRequests.push(now);
  requestLimits.set(key, recentRequests);
  return true;
}

function calculateMatchScore(availability, request, userProfile = {}, filters = {}) {
  let score = 0;
  const overlapPeriods = availability.periods.filter(period => request.periods.includes(period));
  score += (overlapPeriods.length / request.periods.length) * 40;

  if (filters.major) {
    if (userProfile.major === filters.major) {
      score += 30;
    } else if (userProfile.major && userProfile.major.includes(filters.major)) {
      score += 15;
    }
  } else {
    score += 30;
  }

  if (filters.gender) {
    if (userProfile.gender === filters.gender) {
      score += 15;
    }
  } else {
    score += 15;
  }

  if (filters.grade) {
    if (userProfile.grade === filters.grade) {
      score += 15;
    }
  } else {
    score += 15;
  }

  return Math.round(score);
}

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

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!checkRateLimit(req.userId)) {
      return res.status(429).json({ message: '请求过于频繁，请稍后再试（每小时最多 10 次）' });
    }

    const { dayOfWeek, periods, courseInfo, filters, campus, frequencyType } = req.body;

    const availabilities = await Availability.find({
      dayOfWeek,
      status: 'available',
      campuses: campus
    }).populate('userId');

    const matchedSubstitutes = [];

    for (const availability of availabilities) {
      const user = availability.userId;
      if (!user || user._id.toString() === req.userId.toString()) {
        continue;
      }

      const hasOverlap = availability.periods.some(period => periods.includes(period));
      if (!hasOverlap) {
        continue;
      }

      if (filters) {
        if (filters.gender && user.profile?.gender !== filters.gender) continue;
        if (filters.major && user.profile?.major && !user.profile.major.includes(filters.major)) continue;
        if (filters.grade && user.profile?.grade !== filters.grade) continue;
      }

      matchedSubstitutes.push({
        userId: user._id,
        matchScore: calculateMatchScore(availability, { periods }, user.profile, filters || {})
      });
    }

    matchedSubstitutes.sort((a, b) => b.matchScore - a.matchScore);

    const matchRequest = new MatchRequest({
      requesterId: req.userId,
      dayOfWeek,
      periods,
      courseInfo,
      campus,
      frequencyType,
      filters,
      matchedSubstitutes
    });

    await matchRequest.save();

    await ActivityLog.create({
      userId: req.userId,
      actionType: 'create_match_request',
      description: `创建代课需求：周${dayOfWeek} 第${periods.join(',')}节`,
      relatedId: matchRequest._id,
      relatedModel: 'MatchRequest',
      metadata: { dayOfWeek, periods, campus, frequencyType }
    });

    await matchRequest.populate({
      path: 'matchedSubstitutes.userId',
      select: 'username profile.gender profile.major profile.grade'
    });

    res.status(201).json({
      message: '代课需求创建成功',
      matchRequest,
      matchedCount: matchedSubstitutes.length
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await MatchRequest.find({ requesterId: req.userId })
      .populate({
        path: 'matchedSubstitutes.userId',
        select: 'username profile.gender profile.major profile.grade'
      })
      .populate({
        path: 'selectedSubstitute',
        select: 'username profile'
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.put('/:id/select', authMiddleware, async (req, res) => {
  try {
    const { substituteId } = req.body;

    const [matchRequest, requester, substitute] = await Promise.all([
      MatchRequest.findOne({
        _id: req.params.id,
        requesterId: req.userId
      }),
      User.findById(req.userId),
      User.findById(substituteId)
    ]);

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该代课需求' });
    }

    if (!substitute) {
      return res.status(404).json({ message: '未找到被选择的空闲者' });
    }

    const isValidSubstitute = matchRequest.matchedSubstitutes.some(
      item => item.userId.toString() === substituteId
    );

    if (!isValidSubstitute) {
      return res.status(400).json({ message: '无效的空闲者选择' });
    }

    matchRequest.selectedSubstitute = substituteId;
    matchRequest.status = 'matched';

    const substituteIndex = matchRequest.matchedSubstitutes.findIndex(
      item => item.userId.toString() === substituteId
    );
    if (substituteIndex !== -1) {
      matchRequest.matchedSubstitutes[substituteIndex].contactViewed = true;
      matchRequest.matchedSubstitutes[substituteIndex].contactViewedAt = new Date();
    }

    await matchRequest.save();

    const requesterSnapshot = buildUserSnapshot(requester);
    const substituteSnapshot = buildUserSnapshot(substitute);

    await Promise.all([
      InteractionRecord.create({
        category: 'match',
        actionType: 'match_selection',
        sourceUserId: requester._id,
        targetUserId: substitute._id,
        relatedModel: 'MatchRequest',
        relatedId: matchRequest._id,
        sourceSnapshot: requesterSnapshot,
        targetSnapshot: substituteSnapshot,
        context: {
          dayOfWeek: matchRequest.dayOfWeek,
          periods: matchRequest.periods,
          campus: matchRequest.campus,
          frequencyType: matchRequest.frequencyType,
          courseInfo: matchRequest.courseInfo || {}
        }
      }),
      Notification.create({
        userId: substitute._id,
        type: 'substitute_selected',
        title: '你被选为代课人',
        content: `${requester.username} 选择了你，双方联系方式已经开放。`,
        relatedId: matchRequest._id,
        fromUserId: requester._id,
        payload: {
          category: 'match',
          requester: requesterSnapshot,
          substitute: substituteSnapshot,
          context: {
            dayOfWeek: matchRequest.dayOfWeek,
            periods: matchRequest.periods,
            campus: matchRequest.campus,
            frequencyType: matchRequest.frequencyType,
            courseInfo: matchRequest.courseInfo || {}
          }
        }
      }),
      Notification.create({
        userId: requester._id,
        type: 'match_viewed',
        title: '已获取空闲者联系方式',
        content: `你已选择 ${substitute.username}，请尽快联系对方确认代课。`,
        relatedId: matchRequest._id,
        fromUserId: substitute._id,
        payload: {
          category: 'match',
          requester: requesterSnapshot,
          substitute: substituteSnapshot,
          context: {
            dayOfWeek: matchRequest.dayOfWeek,
            periods: matchRequest.periods,
            campus: matchRequest.campus,
            frequencyType: matchRequest.frequencyType,
            courseInfo: matchRequest.courseInfo || {}
          }
        }
      }),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'select_substitute',
        description: `选择空闲者：${substitute.username}`,
        relatedId: matchRequest._id,
        relatedModel: 'MatchRequest',
        metadata: { substituteId }
      })
    ]);

    await matchRequest.populate({
      path: 'selectedSubstitute',
      select: 'username profile'
    });

    res.json({
      message: '选择成功',
      matchRequest,
      requester: requesterSnapshot,
      substitute: substituteSnapshot,
      contactInfo: matchRequest.selectedSubstitute.profile
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/:id/contact', authMiddleware, async (req, res) => {
  try {
    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      requesterId: req.userId
    }).populate({
      path: 'selectedSubstitute',
      select: 'username profile'
    });

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该代课需求' });
    }

    if (!matchRequest.selectedSubstitute) {
      return res.status(400).json({ message: '尚未选择空闲者' });
    }

    res.json({
      substitute: matchRequest.selectedSubstitute
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/matched-to-me', authMiddleware, async (req, res) => {
  try {
    const requests = await MatchRequest.find({
      'matchedSubstitutes.userId': req.userId,
      status: { $in: ['pending', 'matched'] }
    })
      .populate('requesterId', 'username profile')
      .sort({ createdAt: -1 });

    const formatted = requests.map(request => {
      const isSelected = request.selectedSubstitute &&
        request.selectedSubstitute.toString() === req.userId.toString();

      return {
        ...request.toObject(),
        isSelectedByMe: isSelected,
        requesterInfo: isSelected
          ? request.requesterId
          : {
              username: request.requesterId.username,
              profile: {
                gender: request.requesterId.profile?.gender,
                major: request.requesterId.profile?.major,
                grade: request.requesterId.profile?.grade
              }
            }
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const matchRequest = await MatchRequest.findById(req.params.id)
      .populate('requesterId', 'username profile');

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该代课需求' });
    }

    const isMatched = matchRequest.matchedSubstitutes.some(
      item => item.userId.toString() === req.userId.toString()
    );

    if (!isMatched) {
      return res.status(403).json({ message: '你不在该代课需求的候选列表中' });
    }

    const alreadyViewed = matchRequest.viewedBySubstitutes.some(
      view => view.userId.toString() === req.userId.toString()
    );

    if (!alreadyViewed) {
      matchRequest.viewedBySubstitutes.push({
        userId: req.userId,
        viewedAt: new Date()
      });

      await matchRequest.save();

      await Notification.create({
        userId: matchRequest.requesterId._id,
        type: 'match_viewed',
        title: '有空闲者查看了你的代课需求',
        content: '有空闲者对你的代课需求感兴趣，若你选择对方，系统会开放双方联系方式。',
        relatedId: matchRequest._id,
        fromUserId: req.userId
      });
    }

    const isSelected = matchRequest.selectedSubstitute &&
      matchRequest.selectedSubstitute.toString() === req.userId.toString();

    res.json({
      matchRequest,
      isSelected,
      requesterContact: isSelected ? matchRequest.requesterId.profile : null
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      requesterId: req.userId
    });

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该代课需求或无权删除' });
    }

    await Promise.all([
      MatchRequest.findByIdAndDelete(req.params.id),
      InteractionRecord.updateMany(
        { relatedModel: 'MatchRequest', relatedId: req.params.id },
        { status: 'cancelled' }
      ),
      ActivityLog.create({
        userId: req.userId,
        actionType: 'delete_match_request',
        description: '删除代课需求',
        metadata: { matchRequestId: req.params.id }
      })
    ]);

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
