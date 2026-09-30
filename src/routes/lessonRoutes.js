const router = require('express').Router();
const { body } = require('express-validator');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');
const groqService = require('../services/groqService');

// GET /api/lessons?language=Spanish&level=A1 — published lessons, with the learner's completion flag if signed in.
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filter = { published: true };
  if (req.query.language) filter.language = req.query.language;
  if (req.query.level) filter.level = req.query.level;
  const lessons = await Lesson.find(filter).sort({ language: 1, order: 1, createdAt: 1 }).lean();

  let completedIds = new Set();
  if (req.user) {
    const done = await Progress.find({ user: req.user.id, completed: true }).select('lesson').lean();
    completedIds = new Set(done.map(d => String(d.lesson)));
  }
  res.json({ success: true, data: lessons.map(l => ({ ...l, completed: completedIds.has(String(l._id)) })) });
}));

router.get('/languages', asyncHandler(async (req, res) => {
  const languages = await Lesson.distinct('language', { published: true });
  res.json({ success: true, data: languages.sort() });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate('teacher', 'name').lean();
  if (!lesson) throw fail(404, 'Lesson not found.');
  res.json({ success: true, data: lesson });
}));

const lessonRules = [
  body('title').trim().isLength({ min: 1, max: 120 }),
  body('language').trim().isLength({ min: 1, max: 40 }),
  body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  body('content.vocabulary').isArray({ min: 1, max: 60 })
];

router.post('/', requireAuth, requireRole('teacher', 'admin'), lessonRules, validate, asyncHandler(async (req, res) => {
  const lesson = await Lesson.create({ ...req.body, teacher: req.user.id, source: 'teacher' });
  res.status(201).json({ success: true, data: lesson });
}));

// Teacher tool: draft a lesson with AI, still requires the teacher to review + POST / to publish it.
router.post('/generate', requireAuth, requireRole('teacher', 'admin'), [
  body('language').trim().notEmpty(),
  body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  body('topic').trim().notEmpty()
], validate, asyncHandler(async (req, res) => {
  const draft = await groqService.generateLesson({ language: req.body.language, level: req.body.level, topic: req.body.topic });
  res.json({ success: true, data: draft });
}));

router.put('/:id', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw fail(404, 'Lesson not found.');
  if (req.user.role !== 'admin' && String(lesson.teacher) !== req.user.id) throw fail(403, 'You can only edit your own lessons.');
  Object.assign(lesson, req.body);
  await lesson.save();
  res.json({ success: true, data: lesson });
}));

router.delete('/:id', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw fail(404, 'Lesson not found.');
  if (req.user.role !== 'admin' && String(lesson.teacher) !== req.user.id) throw fail(403, 'You can only delete your own lessons.');
  await lesson.deleteOne();
  res.json({ success: true, data: { deleted: true } });
}));

module.exports = router;
