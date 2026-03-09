const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 操作类型
  actionType: {
    type: String,
    enum: [
      'register', 'login',
      'create_availability', 'update_availability', 'delete_availability',
      'create_match_request', 'select_substitute', 'view_contact',
      'create_meal', 'express_meal_interest', 'cancel_meal', 'delete_meal',
      'draw_tarot',
      'update_profile', 'delete_account',
      'admin_delete_user', 'admin_delete_match_request', 'admin_delete_meal',
      'delete_match_request'
    ],
    required: true
  },
  // 操作描述
  description: {
    type: String,
    required: true
  },
  // 关联的资源ID（如果有）
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // 关联的资源类型
  relatedModel: {
    type: String,
    enum: ['Availability', 'MatchRequest', 'MealAppointment', 'User']
  },
  // 额外的元数据
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
