const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MatchRequest = require('../models/MatchRequest');
const Availability = require('../models/Availability');
const User = require('../models/User');

// 请求频率限制：每个用户每小时最多创建10个匹配请求
const requestLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = requestLimits.get(userId.toString()) || [];

  // 清除1小时前的记录
  const recentRequests = userRequests.filter(time => now - time < 3600000);

  if (recentRequests.length >= 10) {
    return false;
  }

  recentRequests.push(now);
  requestLimits.set(userId.toString(), recentRequests);
  return true;
}

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
    // 检查请求频率限制
    if (!checkRateLimit(req.userId)) {
      return res.status(429).json({ message: '请求过于频繁，请稍后再试（每小时最多10次）' });
    }

    const { dayOfWeek, periods, courseInfo, filters, campus, frequencyType } = req.body;

    // 查找该星期几有空的代课者
    const availabilities = await Availability.find({
      dayOfWeek: dayOfWeek,
      status: 'available',
      campuses: campus // 校区匹配
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
      campus,
      frequencyType,
      filters,
      matchedSubstitutes
    });

    await matchRequest.save();

    // 填充用户信息，但隐藏联系方式
    await matchRequest.populate({
      path: 'matchedSubstitutes.userId',
      select: 'username profile.gender profile.major profile.grade' // 只返回基本信息，不包含联系方式
    });

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
      .populate({
        path: 'matchedSubstitutes.userId',
        select: 'username profile.gender profile.major profile.grade' // 只返回基本信息
      })
      .populate({
        path: 'selectedSubstitute',
        select: 'username profile' // 已选择的代课者显示完整信息
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

    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      requesterId: req.userId
    });

    if (!matchRequest) {
      return res.status(404).json({ message: '未找到该匹配请求' });
    }

    // 验证选择的代课者是否在匹配列表中
    const isValidSubstitute = matchRequest.matchedSubstitutes.some(
      sub => sub.userId.toString() === substituteId
    );

    if (!isValidSubstitute) {
      return res.status(400).json({ message: '无效的代课者选择' });
    }

    matchRequest.selectedSubstitute = substituteId;
    matchRequest.status = 'matched';

    // 标记联系方式已查看
    const substituteIndex = matchRequest.matchedSubstitutes.findIndex(
      sub => sub.userId.toString() === substituteId
    );
    if (substituteIndex !== -1) {
      matchRequest.matchedSubstitutes[substituteIndex].contactViewed = true;
      matchRequest.matchedSubstitutes[substituteIndex].contactViewedAt = new Date();
    }

    await matchRequest.save();

    // 填充选中的代课者完整信息（包含联系方式）
    await matchRequest.populate({
      path: 'selectedSubstitute',
      select: 'username profile'
    });

    res.json({
      message: '选择代课者成功',
      matchRequest,
      contactInfo: matchRequest.selectedSubstitute.profile // 返回联系方式
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取已选择代课者的联系方式
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
      return res.status(404).json({ message: '未找到该匹配请求' });
    }

    if (!matchRequest.selectedSubstitute) {
      return res.status(400).json({ message: '尚未选择代课者' });
    }

    res.json({
      substitute: matchRequest.selectedSubstitute
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
