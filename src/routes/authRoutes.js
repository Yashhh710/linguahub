const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const Streak = require('../models/Streak');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');
const { issueUserToken } = require('../services/tokenService');
const firebaseService = require('../services/firebaseService');

const registerRules = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('nativeLanguage').optional().trim().isLength({ max: 40 })
];

router.post('/register', registerRules, validate, asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  if (await User.findOne({ email })) throw fail(409, 'An account with that email already exists.');
  const password = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password,
    nativeLanguage: req.body.nativeLanguage?.trim() || 'English',
    learningLanguages: req.body.learningLanguage ? [req.body.learningLanguage.trim()] : [],
    timezone: req.body.timezone || 'UTC'
  });
  await Streak.create({ user: user._id, currentStreak: 0, longestStreak: 0, lastActiveDay: '', days: [] });
  res.status(201).json({ success: true, data: { token: issueUserToken(user), user: user.toPublic() } });
}));

router.post('/login', [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
], validate, asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+password');
  if (!user || !user.password || !(await bcrypt.compare(req.body.password, user.password))) {
    throw fail(401, 'Incorrect email or password.');
  }
  res.json({ success: true, data: { token: issueUserToken(user), user: user.toPublic() } });
}));

// Google sign-in: browser gets a Firebase ID token from the Google popup, server verifies it here.
router.post('/google', [body('idToken').notEmpty().withMessage('Missing Google credential.')], validate, asyncHandler(async (req, res) => {
  const decoded = await firebaseService.verifyIdToken(req.body.idToken);
  const email = (decoded.email || '').toLowerCase();
  if (!email) throw fail(400, 'Google account has no email.');

  let user = await User.findOne({ $or: [{ firebaseUid: decoded.uid }, { email }] });
  if (!user) {
    user = await User.create({ name: decoded.name || email.split('@')[0], email, authProvider: 'google', firebaseUid: decoded.uid });
    await Streak.create({ user: user._id, currentStreak: 0, longestStreak: 0, lastActiveDay: '', days: [] });
  } else if (!user.firebaseUid) {
    user.firebaseUid = decoded.uid;
    user.authProvider = 'google';
    await user.save();
  }
  res.json({ success: true, data: { token: issueUserToken(user), user: user.toPublic() } });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw fail(401, 'Account no longer exists.');
  res.json({ success: true, data: user.toPublic() });
}));

router.patch('/me', requireAuth, [
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('nativeLanguage').optional().trim().isLength({ max: 40 }),
  body('learningLanguages').optional().isArray({ max: 10 }),
  body('avatar').optional().isString().isLength({ max: 150000 }).bail().custom(avatar =>
    avatar === ''
    || /^\/assets\/(?:mascot-(?:book|headphones|idea)|hero)\.png$/.test(avatar)
    || /^\/assets\/pfp\/(?:avatar_maya|avatar_sophie|avatar_yash|cute-2)\.jpg$/.test(avatar)
    || /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)
  ).withMessage('Choose a preset avatar or upload a JPG image.'),
  body('dailyGoalMinutes').optional().isInt({ min: 5, max: 240 }),
  body('timezone').optional().trim().isLength({ max: 60 })
], validate, asyncHandler(async (req, res) => {
  const fields = ['name', 'nativeLanguage', 'learningLanguages', 'avatar', 'dailyGoalMinutes', 'timezone'];
  const updates = {};
  for (const field of fields) if (req.body[field] !== undefined) updates[field] = req.body[field];
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user.toPublic() });
}));

router.put('/me/reminder', requireAuth, [
  body('enabled').isBoolean(),
  body('hour').optional().isInt({ min: 0, max: 23 })
], validate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, {
    'reminder.enabled': req.body.enabled,
    ...(req.body.hour !== undefined ? { 'reminder.hour': req.body.hour } : {})
  }, { new: true });
  res.json({ success: true, data: user.toPublic() });
}));

router.put('/me/password', requireAuth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
], validate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!user.password || !(await bcrypt.compare(req.body.currentPassword, user.password))) throw fail(401, 'Current password is incorrect.');
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ success: true, data: { updated: true } });
}));

// Registers a browser's FCM token so push notifications can be delivered to it.
router.post('/me/fcm-token', requireAuth, [body('token').notEmpty()], validate, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { fcmTokens: req.body.token } });
  res.json({ success: true, data: { registered: true } });
}));

module.exports = router;
