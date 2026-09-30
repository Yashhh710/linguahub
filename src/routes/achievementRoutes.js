const router = require('express').Router();
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const catalog = await Achievement.find().sort({ category: 1, goal: 1 }).lean();
  res.json({ success: true, data: catalog });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [catalog, unlocked] = await Promise.all([
    Achievement.find().sort({ category: 1, goal: 1 }).lean(),
    UserAchievement.find({ user: req.user.id }).lean()
  ]);
  const unlockedMap = new Map(unlocked.map(u => [String(u.achievement), u.unlockedAt]));
  const data = catalog.map(a => ({ ...a, unlocked: unlockedMap.has(String(a._id)), unlockedAt: unlockedMap.get(String(a._id)) || null }));
  res.json({ success: true, data });
}));

module.exports = router;
