const mongoose = require('mongoose');

const userSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  profile: {
    gender: String,
    major: String,
    grade: String,
    phone: String,
    email: String,
    wechat: String
  }
}, { _id: false });

const interactionRecordSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['match', 'meal'],
    required: true
  },
  actionType: {
    type: String,
    enum: ['match_selection', 'meal_interest'],
    required: true
  },
  sourceUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedModel: {
    type: String,
    enum: ['MatchRequest', 'MealAppointment'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sourceSnapshot: {
    type: userSnapshotSchema,
    required: true
  },
  targetSnapshot: {
    type: userSnapshotSchema,
    required: true
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

interactionRecordSchema.index({ sourceUserId: 1, createdAt: -1 });
interactionRecordSchema.index({ targetUserId: 1, createdAt: -1 });
interactionRecordSchema.index({ relatedModel: 1, relatedId: 1, createdAt: -1 });

module.exports = mongoose.model('InteractionRecord', interactionRecordSchema);
