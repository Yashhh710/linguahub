const router = require('express').Router();
const Streak = require('../models/Streak');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { dayKey, lastDays } = require('../utils/dates');
const { effectiveStreak } = require('../utils/gamification');

// Read-only: streaks are only ever changed as a side effect of awardXp (lesson/quiz/voice activity).
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  const streak = await Streak.findOne({ user: req.user.id }).lean();
  const today = dayKey(new Date(), user?.timezone);
  const activeDays = new Set(streak?.days || []);
  const protectedDays = new Set(streak?.protectedDays || []);
  const currentStreak = streak ? effectiveStreak(streak, today) : 0;
  const freezesAvailable = streak?.freezesAvailable || 0;
  const daysUntilNextFreeze = freezesAvailable ? null : (7 - (currentStreak % 7) || 7);
  const last30 = lastDays(today, 30).map(day => ({
    day,
    active: activeDays.has(day),
    protected: protectedDays.has(day)
  }));

  res.json({
    success: true,
    data: {
      currentStreak,
      longestStreak: streak?.longestStreak || 0,
      freezesAvailable,
      daysUntilNextFreeze,
      lastActiveDay: streak?.lastActiveDay || null,
      calendar: last30
    }
  });
}));

module.exports = router;
