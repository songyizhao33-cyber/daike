const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 反馈类型
  type: {
    type: String,
    enum: ['bug', 'feature', 'suggestion', 'other'],
    required: true
  },
  // 标题
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  // 内容
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // 联系方式（可选，如果用户想要回复）
  contactInfo: {
    type: String
  },
  // 状态
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'resolved'],
    default: 'pending'
  },
  // 管理员回复
  adminReply: {
    content: String,
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
