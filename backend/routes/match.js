const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MatchRequest = require('../models/MatchRequest');
const Availability = require('../models/Availability');
const User = require('../models/User');

// 计算匹配分数
function calculateMatchScore(availability, request, userProfile, filters) {
  let score = 0;

  // 时间匹配度（40分）：检查节次重叠
  const overlapPeriods = availability.periods.filter(p => request.periods.includes(p));
  const timeScore = (overlapPeriods.length / request.periods.length) * 40;
  score += timeScore;

  // 专业相似度（30分）
  if (filters.major) {
    if (userProfile.major === filters.major) {
      score += 30;
    } else if (userProfile.major && userProfile.major.includes(filters.major)) {
      score += 15;
    }
  } else {
    score += 30; // 如果没有专业要求，给满分
  }

  // 性别匹配（15分）
  if (filters.gender) {
    if (userProfile.gender === filters.gender) {
      score += 15;
    }
  } else {
    score += 15;
  }

  // 年级匹配（15分）
  if (filters.grade) {
    if (userProfile.grade === filters.grade) {
      score += 15;
    }
  } else {
    score += 15;
  }

  return Math.round(score);
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dayOfWeek, periods, courseInfo, filters } = req.body;

    // 查找该星期几有空的代课者
    const availabilities = await Availability.find({
      dayOfWeek: dayOfWeek,
      status: 'available'
    }).populate('userId');

    // 计算匹配分数
    const matchedSubstitutes = [];

    for (const availability of availabilities) {
      const user = availability.userId;

      // 排除自己
      if (user._id.toString() === req.userId.toString()) {
        continue;
      }

      // 检查是否有节次重叠
      const hasOverlap = availability.periods.some(p => periods.includes(p));
      if (!hasOverlap) {
        continue;
      }

      // 应用筛选条件
      if (filters) {
        if (filters.gender && user.profile.gender !== filters.gender) continue;
        if (filters.major && user.profile.major && !user.profile.major.includes(filters.major)) continue;
        if (filters.grade && user.profile.grade !== filters.grade) continue;
      }

      // 计算匹配分数
      const matchScore = calculateMatchScore(availability, { periods }, user.profile, filters || {});

      matchedSubstitutes.push({
        userId: user._id,
        matchScore: matchScore
      });
    }

    // 按匹配分数排序
    matchedSubstitutes.sort((a, b) => b.matchScore - a.matchScore);

    const matchRequest = new MatchRequest({
      requesterId: req.userId,
      dayOfWeek,
      periods,
      courseInfo,
      filters,
      matchedSubstitutes
    });

    await matchRequest.save();

    await matchRequest.populate('matchedSubstitutes.userId');

    res.status(201).json({
      message: '匹配请求创建成功',
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
      .populate('matchedSubstitutes.userId')
      .populate('selectedSubstitute')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.put('/:id/select', authMiddleware, async (req, res) => {
  try {
    const { substituteId } = req.body;

    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      requesterId: req.userId
    });

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该匹配请求' });
    }

    matchRequest.selectedSubstitute = substituteId;
    matchRequest.status = 'matched';
    await matchRequest.save();

    res.json({ message: '选择代课者成功', matchRequest });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
