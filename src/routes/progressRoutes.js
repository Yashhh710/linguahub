const router = require('express').Router();
const { body } = require('express-validator');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const XpEvent = require('../models/XpEvent');
const QuizAttempt = require('../models/QuizAttempt');
const Streak = require('../models/Streak');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');
const { dayKey, lastDays } = require('../utils/dates');
const { awardXp } = require('../services/gamificationService');

// GET /api/progress — the learner's full dashboard: totals, weekly XP chart, per-skill mix, recent activity.
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).lean();
  const [totalLessons, completedCount, records, streak, quizStats] = await Promise.all([
    Lesson.countDocuments({ published: true }),
    Progress.countDocuments({ user: userId, completed: true }),
    Progress.find({ user: userId }).populate('lesson', 'title language level').sort({ lastAccessed: -1 }).limit(10).lean(),
    Streak.findOne({ user: userId }).lean(),
    QuizAttempt.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, count: { $sum: 1 }, avgPercent: { $avg: '$percent' }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } }
    ])
  ]);

  const today = dayKey(new Date(), user.timezone);
  const days = lastDays(today, 7);
  const events = await XpEvent.find({ user: userId, createdAt: { $gte: new Date(Date.now() - 8 * 86400000) } }).lean();
  const byDay = Object.fromEntries(days.map(d => [d, 0]));
  for (const event of events) {
    const key = dayKey(event.createdAt, user.timezone);
    if (key in byDay) byDay[key] += event.xp;
  }

  const recent = [
    ...records.map(r => ({ title: r.lesson?.title || 'Lesson', detail: r.completed ? 'Completed lesson' : 'Started lesson', time: r.lastAccessed })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  res.json({
    success: true,
    data: {
      overallPercent: totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0,
      lessonsCompleted: completedCount,
      lessonsTotal: totalLessons,
      quizAttempts: quizStats[0]?.count || 0,
      quizAccuracy: quizStats[0] ? Math.round(quizStats[0].avgPercent) : 0,
      quizzesPassed: quizStats[0]?.passed || 0,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      weekly: days.map(d => ({ day: d, xp: byDay[d] })),
      recent
    }
  });
}));

router.get('/lessons/:lessonId', requireAuth, asyncHandler(async (req, res) => {
  const record = await Progress.findOne({ user: req.user.id, lesson: req.params.lessonId }).lean();
  res.json({ success: true, data: record || { lesson: req.params.lessonId, completed: false, timeSpentSec: 0 } });
}));

// PUT /api/progress/lessons/:lessonId — mark a lesson as viewed, and optionally completed (awards XP once).
router.put('/lessons/:lessonId', requireAuth, [
  body('completed').optional().isBoolean(),
  body('timeSpentSec').optional().isInt({ min: 0 })
], validate, asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId).lean();
  if (!lesson) throw fail(404, 'Lesson not found.');

  let record = await Progress.findOne({ user: req.user.id, lesson: lesson._id });
  const wasCompleted = record?.completed || false;
  const nowCompleting = req.body.completed === true && !wasCompleted;

  if (!record) record = new Progress({ user: req.user.id, lesson: lesson._id });
  if (req.body.timeSpentSec) record.timeSpentSec += req.body.timeSpentSec;
  record.lastAccessed = new Date();
  if (req.body.completed === true) { record.completed = true; record.completedAt = new Date(); }
  if (nowCompleting) record.xpAwarded = lesson.xpReward || 20;
  await record.save();

  let gains = null;
  if (nowCompleting) {
    gains = await awardXp(req.app.get('io'), {
      userId: req.user.id, xp: lesson.xpReward || 20, source: 'lesson', ref: String(lesson._id), label: lesson.title, language: lesson.language
    });
  }

  res.json({ success: true, data: { progress: record, gains } });
}));

module.exports = router;
