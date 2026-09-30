const mongoose = require('mongoose');
const { LEVELS } = require('./Lesson');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 500 },
  options: {
    type: [{ type: String, trim: true, maxlength: 200 }],
    validate: { validator: v => v.length === 4 && v.every(Boolean), message: 'Each question needs exactly four non-empty options.' }
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3, validate: Number.isInteger },
  explanation: { type: String, trim: true, maxlength: 500, default: '' }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  language: { type: String, required: true, trim: true, maxlength: 40 },
  level: { type: String, enum: LEVELS, default: 'A1' },
  topic: { type: String, trim: true, maxlength: 80, default: '' },
  xpReward: { type: Number, default: 50, min: 0, max: 1000 },
  questions: {
    type: [questionSchema],
    validate: { validator: v => v.length >= 1 && v.length <= 30, message: 'A quiz needs 1 to 30 questions.' }
  },
  source: { type: String, enum: ['teacher', 'ai', 'curriculum'], default: 'teacher' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

quizSchema.index({ language: 1, createdAt: -1 });
quizSchema.index({ lesson: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
