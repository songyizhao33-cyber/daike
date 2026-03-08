const mongoose = require('mongoose');

const tarotSchema = new mongoose.Schema({
  // 塔罗牌名称
  name: {
    type: String,
    required: true,
    unique: true
  },
  // 图片文件名
  imageFile: {
    type: String,
    required: true
  },
  // 正位解释
  uprightMeaning: {
    type: String,
    required: true
  },
  // 逆位解释
  reversedMeaning: {
    type: String,
    required: true
  },
  // 序号（0-21）
  order: {
    type: Number,
    required: true,
    min: 0,
    max: 21
  }
});

tarotSchema.index({ order: 1 });

module.exports = mongoose.model('Tarot', tarotSchema);
