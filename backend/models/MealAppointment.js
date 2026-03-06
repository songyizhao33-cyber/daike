const mongoose = require('mongoose');

const mealAppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 日期
  date: {
    type: Date,
    required: true
  },
  // 用餐时间段
  mealTime: {
    type: String,
    enum: [
      '07:00', '07:30', '08:00',
      '11:00', '11:30', '12:00', '12:30',
      '17:00', '17:30', '18:00', '18:30'
    ],
    required: true
  },
  // 用餐类型
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  // 地点
  location: {
    type: String,
    required: true
  },
  // 校区
  campus: {
    type: String,
    enum: ['邯郸', '枫林', '江湾', '张江'],
    required: true
  },
  // 备注
  note: {
    type: String,
    default: ''
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

mealAppointmentSchema.index({ date: 1, mealTime: 1 });
mealAppointmentSchema.index({ userId: 1 });

module.exports = mongoose.model('MealAppointment', mealAppointmentSchema);
