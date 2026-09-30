const router = require('express').Router();
const User = require('../models/User');
const XpEvent = require('../models/XpEvent');
const Friendship = require('../models/Friendship');
const { optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/leaderboard?scope=global|friends&period=week|alltime
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const period = req.query.period === 'alltime' ? 'alltime' : 'week';
  const scope = req.query.scope === 'friends' && req.user ? 'friends' : 'global';

  let userFilter = {};
  if (scope === 'friends') {
    const links = await Friendship.find({ status: 'accepted', $or: [{ requester: req.user.id }, { recipient: req.user.id }] }).lean();
    const ids = links.map(l => String(l.requester) === req.user.id ? l.recipient : l.requester);
    ids.push(req.user.id);
    userFilter = { _id: { $in: ids } };
  }

  let rows;
  if (period === 'alltime') {
    rows = await User.find(userFilter).select('name xp avatar').sort({ xp: -1 }).limit(50).lean();
    rows = rows.map(user => ({ id: user._id, name: user.name, xp: user.xp, avatar: user.avatar || '' }));
  } else {
    const since = new Date(Date.now() - 7 * 86400000);
    const userIds = scope === 'friends' ? userFilter._id.$in : null;
    const match = { createdAt: { $gte: since }, ...(userIds ? { user: { $in: userIds } } : {}) };
    const grouped = await XpEvent.aggregate([
      { $match: match },
      { $group: { _id: '$user', xp: { $sum: '$xp' } } },
      { $sort: { xp: -1 } },
      { $limit: 50 }
    ]);
    const users = await User.find({ _id: { $in: grouped.map(g => g._id) } }).select('name avatar').lean();
    const userById = new Map(users.map(user => [String(user._id), user]));
    rows = grouped.map(group => {
      const user = userById.get(String(group._id));
      return { id: group._id, name: user?.name || 'Learner', avatar: user?.avatar || '', xp: group.xp };
    });
  }

  const withRank = rows.map((row, i) => ({ ...row, rank: i + 1, isMe: req.user ? String(row.id) === req.user.id : false }));
  res.json({ success: true, data: { scope, period, rows: withRank } });
}));

module.exports = router;
