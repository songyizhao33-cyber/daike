const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');

// 用户提交反馈
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, title, content, contactInfo } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '标题和内容不能为空' });
    }

    const feedback = new Feedback({
      userId: req.userId,
      type,
      title,
      content,
      contactInfo
    });

    await feedback.save();

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'create_feedback',
      description: `提交反馈：${title}`,
      relatedId: feedback._id,
      relatedModel: 'Feedback'
    });

    res.status(201).json({ message: '反馈提交成功', feedback });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 用户查看自己的反馈
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员查看所有反馈
router.get('/all', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'username profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
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

// 管理员标记为已读
router.put('/:id/read', adminAuthMiddleware, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ message: '已标记为已读', feedback });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员回复反馈
router.put('/:id/reply', adminAuthMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: '回复内容不能为空' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status: 'replied',
        adminReply: {
          content,
          repliedAt: new Date(),
          repliedBy: req.userId
        }
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ message: '回复成功', feedback });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 管理员标记为已解决
router.put('/:id/resolve', adminAuthMiddleware, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: '反馈不存在' });
    }

    res.json({ message: '已标记为已解决', feedback });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
