const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 回访类型
  type: {
    type: String,
    enum: ['substitute', 'meal'],
    required: true
  },
  // 关联的记录ID
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // 评分 (1-5)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // 体验描述
  experience: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'terrible'],
    required: true
  },
  // 详细反馈
  comment: {
    type: String,
    maxlength: 500
  },
  // 是否愿意再次使用
  willUseAgain: {
    type: Boolean,
    required: true
  },
  // 建议
  suggestions: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ userId: 1, type: 1 });
reviewSchema.index({ relatedId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
