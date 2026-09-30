const router = require('express').Router();
const { body, query } = require('express-validator');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Streak = require('../models/Streak');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');

async function friendSummaries(userIds) {
  const [users, streaks] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name email xp').lean(),
    Streak.find({ user: { $in: userIds } }).lean()
  ]);
  const streakByUser = new Map(streaks.map(s => [String(s.user), s.currentStreak]));
  return users.map(u => ({ id: u._id, name: u.name, email: u.email, xp: u.xp, currentStreak: streakByUser.get(String(u._id)) || 0 }));
}

// GET /api/friends — accepted friends, with pending requests split by direction.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const me = req.user.id;
  const links = await Friendship.find({ $or: [{ requester: me }, { recipient: me }] }).lean();

  const acceptedIds = links.filter(l => l.status === 'accepted').map(l => String(l.requester) === me ? l.recipient : l.requester);
  const incoming = links.filter(l => l.status === 'pending' && String(l.recipient) === me);
  const outgoing = links.filter(l => l.status === 'pending' && String(l.requester) === me);

  const [friends, incomingUsers, outgoingUsers] = await Promise.all([
    friendSummaries(acceptedIds),
    friendSummaries(incoming.map(l => l.requester)),
    friendSummaries(outgoing.map(l => l.recipient))
  ]);
  const requestIdFor = (list, userId) => list.find(l => String(l.requester) === String(userId) || String(l.recipient) === String(userId))?._id;

  res.json({
    success: true,
    data: {
      friends: friends.sort((a, b) => b.xp - a.xp),
      incomingRequests: incomingUsers.map(u => ({ ...u, requestId: requestIdFor(incoming, u.id) })),
      outgoingRequests: outgoingUsers.map(u => ({ ...u, requestId: requestIdFor(outgoing, u.id) }))
    }
  });
}));

router.get('/search', requireAuth, [query('q').trim().isLength({ min: 2, max: 80 })], validate, asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(`^${req.query.q}`, 'i') }]
  }).select('name email').limit(10).lean();
  res.json({ success: true, data: users });
}));

router.post('/requests', requireAuth, [body('userId').isMongoId()], validate, asyncHandler(async (req, res) => {
  const targetId = req.body.userId;
  if (targetId === req.user.id) throw fail(400, "You can't add yourself as a friend.");
  if (!(await User.exists({ _id: targetId }))) throw fail(404, 'User not found.');

  const existing = await Friendship.findOne({ $or: [{ requester: req.user.id, recipient: targetId }, { requester: targetId, recipient: req.user.id }] });
  if (existing) throw fail(409, existing.status === 'accepted' ? 'You are already friends.' : 'A request already exists between you two.');

  const request = await Friendship.create({ requester: req.user.id, recipient: targetId, status: 'pending' });
  req.app.get('io').to(`user:${targetId}`).emit('friendRequest', { requestId: request._id });
  res.status(201).json({ success: true, data: request });
}));

router.put('/requests/:id', requireAuth, [body('action').isIn(['accept', 'decline'])], validate, asyncHandler(async (req, res) => {
  const request = await Friendship.findById(req.params.id);
  if (!request) throw fail(404, 'Request not found.');
  if (String(request.recipient) !== req.user.id) throw fail(403, 'Only the recipient can respond to this request.');
  request.status = req.body.action === 'accept' ? 'accepted' : 'declined';
  await request.save();
  if (request.status === 'accepted') req.app.get('io').to(`user:${request.requester}`).emit('friendAccepted', { by: req.user.id });
  res.json({ success: true, data: request });
}));

router.delete('/:friendId', requireAuth, asyncHandler(async (req, res) => {
  await Friendship.deleteOne({
    status: 'accepted',
    $or: [{ requester: req.user.id, recipient: req.params.friendId }, { requester: req.params.friendId, recipient: req.user.id }]
  });
  res.json({ success: true, data: { removed: true } });
}));

module.exports = router;
