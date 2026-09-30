const router = require('express').Router();
const { body } = require('express-validator');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const fail = require('../utils/httpError');
const groqService = require('../services/groqService');
const { awardXp } = require('../services/gamificationService');

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.language) filter.language = req.query.language;
  if (req.query.lesson) filter.lesson = req.query.lesson;
  const quizzes = await Quiz.find(filter).select('-questions.correctAnswer -questions.explanation').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: quizzes });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).select('-questions.correctAnswer -questions.explanation').lean();
  if (!quiz) throw fail(404, 'Quiz not found.');
  res.json({ success: true, data: quiz });
}));

// AI generation is open to signed-in learners for on-demand practice; publishing a reusable Quiz stays teacher/admin-only.
router.post('/generate', requireAuth, [
  body('language').trim().notEmpty(),
  body('level').trim().notEmpty(),
  body('topic').trim().notEmpty(),
  body('count').optional().isInt({ min: 3, max: 20 })
], validate, asyncHandler(async (req, res) => {
  const count = Math.min(20, Math.max(3, Number(req.body.count) || 10));
  const quiz = await groqService.generateQuiz({ language: req.body.language, level: req.body.level, topic: req.body.topic, count });
  res.json({ success: true, data: quiz });
}));

const quizRules = [
  body('title').trim().isLength({ min: 1, max: 120 }),
  body('language').trim().notEmpty(),
  body('questions').isArray({ min: 1, max: 30 })
];

router.post('/', requireAuth, requireRole('teacher', 'admin'), quizRules, validate, asyncHandler(async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, createdBy: req.user.id, source: req.body.source === 'ai' ? 'ai' : 'teacher' });
  res.status(201).json({ success: true, data: quiz });
}));

router.put('/:id', requireAuth, requireRole('teacher', 'admin'), asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw fail(404, 'Quiz not found.');
  if (req.user.role !== 'admin' && String(quiz.createdBy) !== req.user.id) throw fail(403, 'You can only edit your own quizzes.');
  Object.assign(quiz, req.body);
  await quiz.save();
  res.json({ success: true, data: quiz });
}));

// Grades a submitted attempt server-side (never trust client-reported scores) and awards XP once per attempt.
router.post('/:id/attempts', requireAuth, [
  body('answers').isArray({ min: 1 }),
  body('timeSpentSec').optional().isInt({ min: 0 })
], validate, asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) throw fail(404, 'Quiz not found.');
  const answers = req.body.answers;
  if (answers.length !== quiz.questions.length) throw fail(400, `Expected ${quiz.questions.length} answers, received ${answers.length}.`);

  const score = quiz.questions.reduce((total, q, i) => total + (answers[i] === q.correctAnswer ? 1 : 0), 0);
  const percent = Math.round((score / quiz.questions.length) * 100);
  const passed = percent >= 70;
  const xpEarned = passed ? Math.round((quiz.xpReward || 50) * (percent / 100)) : Math.round((quiz.xpReward || 50) * 0.2);

  const attempt = await QuizAttempt.create({
    user: req.user.id, quiz: quiz._id, lesson: quiz.lesson, quizTitle: quiz.title, language: quiz.language,
    score, total: quiz.questions.length, percent, passed, xpEarned, answers, timeSpentSec: req.body.timeSpentSec || 0
  });

  const gains = await awardXp(req.app.get('io'), {
    userId: req.user.id, xp: xpEarned, source: 'quiz', ref: String(quiz._id), label: quiz.title, language: quiz.language
  });

  const review = quiz.questions.map((q, i) => ({
    question: q.question, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation, yourAnswer: answers[i] ?? null
  }));

  res.status(201).json({ success: true, data: { attempt: { ...attempt.toObject(), review }, gains } });
}));

router.get('/attempts/me', requireAuth, asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: attempts });
}));

module.exports = router;
