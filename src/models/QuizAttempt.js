const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  quizTitle: { type: String, default: '' },
  language: { type: String, default: '' },
  score: { type: Number, required: true, min: 0 },          // number correct
  total: { type: Number, required: true, min: 1 },
  percent: { type: Number, required: true, min: 0, max: 100 },
  passed: { type: Boolean, default: false },
  xpEarned: { type: Number, default: 0 },
  answers: { type: [Number], default: [] },
  timeSpentSec: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

attemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', attemptSchema);
