const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');

// 用户提交回访
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, relatedId, rating, experience, comment, willUseAgain, suggestions } = req.body;

    if (!type || !relatedId || !rating || !experience || willUseAgain === undefined) {
      return res.status(400).json({ message: '请填写所有必填项' });
    }

    // 检查是否已经提交过回访
    const existingReview = await Review.findOne({
      userId: req.userId,
      type,
      relatedId
    });

    if (existingReview) {
      return res.status(400).json({ message: '您已经提交过回访了' });
    }

    const review = new Review({
      userId: req.userId,
      type,
      relatedId,
      rating,
      experience,
      comment,
      willUseAgain,
      suggestions
    });

    await review.save();

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'submit_review',
      description: `提交${type === 'substitute' ? '代课' : '约饭'}回访`,
      relatedId: review._id,
      relatedModel: 'Review',
      metadata: { rating, experience }
    });

    res.status(201).json({ message: '回访提交成功', review });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 用户查看自己的回访
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;

    const query = { userId: req.userId };
    if (type) {
      query.type = type;
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 检查是否已提交回访
router.get('/check/:type/:relatedId', authMiddleware, async (req, res) => {
  try {
    const { type, relatedId } = req.params;

    const review = await Review.findOne({
      userId: req.userId,
      type,
      relatedId
    });

    res.json({ hasReviewed: !!review, review });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员查看所有回访（统计分析）
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const { type } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }

    const totalReviews = await Review.countDocuments(query);

    // 平均评分
    const avgRatingResult = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult[0]?.avgRating || 0;

    // 体验分布
    const experienceDistribution = await Review.aggregate([
      { $match: query },
      { $group: { _id: '$experience', count: { $sum: 1 } } }
    ]);

    // 愿意再次使用的比例
    const willUseAgainCount = await Review.countDocuments({ ...query, willUseAgain: true });
    const willUseAgainRate = totalReviews > 0 ? (willUseAgainCount / totalReviews * 100).toFixed(2) : 0;

    res.json({
      totalReviews,
      avgRating: avgRating.toFixed(2),
      experienceDistribution,
      willUseAgainRate: `${willUseAgainRate}%`
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员查看所有回访列表
router.get('/all', adminAuthMiddleware, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }

    const reviews = await Review.find(query)
      .populate('userId', 'username profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
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

module.exports = router;
