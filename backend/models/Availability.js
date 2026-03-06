const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  userId: {
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
  // 校区 (可多选)
  campuses: [{
    type: String,
    enum: ['邯郸', '枫林', '江湾', '张江'],
    required: true
  }],
  // 频率类型
  frequencyType: {
    type: String,
    enum: ['long-term', 'short-term', 'single'],
    required: true
  },
  // 是否长期有效
  isRecurring: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

availabilitySchema.index({ userId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
