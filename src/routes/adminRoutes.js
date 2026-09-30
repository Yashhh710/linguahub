const router = require('express').Router();
const { body } = require('express-validator');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', asyncHandler(async (req, res) => {
  const [users, students, teachers, lessons, quizzes, attempts] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'student' }), User.countDocuments({ role: 'teacher' }),
    Lesson.countDocuments(), Quiz.countDocuments(), QuizAttempt.countDocuments()
  ]);
  res.json({ success: true, data: { users, students, teachers, lessons, quizzes, attempts } });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.$or = [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(req.query.q, 'i') }];
  const users = await User.find(filter).select('-fcmTokens').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data: users });
}));

// Promotes/demotes a user's role. Guarded so the last admin can't accidentally demote themselves out.
router.put('/users/:id/role', [body('role').isIn(['student', 'teacher', 'admin'])], validate, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id && req.body.role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw fail(400, 'You are the only admin — promote someone else first.');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-fcmTokens');
  if (!user) throw fail(404, 'User not found.');
  res.json({ success: true, data: user });
}));

module.exports = router;
