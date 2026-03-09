const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 通知类型
  type: {
    type: String,
    enum: [
      'substitute_selected', // 被选为代课者
      'meal_interest', // 有人对约饭感兴趣
      'match_viewed' // 匹配请求被查看
    ],
    required: true
  },
  // 通知标题
  title: {
    type: String,
    required: true
  },
  // 通知内容
  content: {
    type: String,
    required: true
  },
  // 关联的资源ID
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // 关联的用户（触发通知的用户）
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
