const mongoose = require('mongoose');

const matchRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 星期几 (1-6: 周一到周六)
  dayOfWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  // 节次 (1-14)
  periods: [{
    type: Number,
    required: true,
    min: 1,
    max: 14
  }],
  courseInfo: {
    courseName: String,
    location: String,
    description: String
  },
  filters: {
    gender: String,
    major: String,
    grade: String
  },
  matchedSubstitutes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchScore: Number
  }],
  selectedSubstitute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

matchRequestSchema.index({ requesterId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('MatchRequest', matchRequestSchema);
