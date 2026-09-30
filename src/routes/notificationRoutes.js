const router = require('express').Router();
const { body } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const firebaseService = require('../services/firebaseService');

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).lean();
  res.json({ success: true, data: notifications });
}));

router.put('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { read: true });
  res.json({ success: true, data: { read: true } });
}));

router.put('/read-all', requireAuth, asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ success: true, data: { read: true } });
}));

// Sends the learner a "come back and practice" push using their own stored FCM token(s), if any.
router.post('/lesson-reminder', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+fcmTokens name');
  const notification = { title: 'Time to learn', body: `Your next LinguaHub lesson is waiting, ${user.name}.` };
  await Notification.create({ user: user._id, title: notification.title, body: notification.body, type: 'reminder' });
  const result = await firebaseService.sendPushToMany(user.fcmTokens || [], notification);
  res.json({ success: true, data: { sent: result.successCount > 0, ...result } });
}));

// Teacher/admin broadcast to every student — used for announcements like "new French course live".
router.post('/announce', requireAuth, requireRole('teacher', 'admin'), [
  body('title').trim().isLength({ min: 1, max: 120 }),
  body('body').trim().isLength({ min: 1, max: 500 })
], validate, asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('_id fcmTokens').lean();
  await Notification.insertMany(students.map(s => ({ user: s._id, title: req.body.title, body: req.body.body, type: 'announcement', sender: req.user.id })));
  const io = req.app.get('io');
  for (const s of students) io.to(`user:${s._id}`).emit('notification', { title: req.body.title, body: req.body.body });
  const tokens = students.flatMap(s => s.fcmTokens || []);
  const push = await firebaseService.sendPushToMany(tokens, { title: req.body.title, body: req.body.body });
  res.json({ success: true, data: { recipients: students.length, push } });
}));

module.exports = router;
