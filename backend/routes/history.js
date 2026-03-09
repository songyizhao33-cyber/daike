const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Availability = require('../models/Availability');
const MatchRequest = require('../models/MatchRequest');
const MealAppointment = require('../models/MealAppointment');
const InteractionRecord = require('../models/InteractionRecord');

router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const [availabilities, matchRequests, mealAppointments, interactions] = await Promise.all([
      Availability.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100),
      MatchRequest.find({ requesterId: userId })
        .populate('selectedSubstitute', 'username profile')
        .sort({ createdAt: -1 })
        .limit(100),
      MealAppointment.find({ userId })
        .populate('interestedUsers.userId', 'username profile')
        .sort({ createdAt: -1 })
        .limit(100),
      InteractionRecord.find({
        $or: [{ sourceUserId: userId }, { targetUserId: userId }]
      })
        .sort({ createdAt: -1 })
        .limit(200)
    ]);

    res.json({
      availabilities,
      matchRequests,
      mealAppointments,
      interactions
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;
