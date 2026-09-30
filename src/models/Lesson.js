const mongoose = require('mongoose');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const vocabSchema = new mongoose.Schema({
  term: { type: String, required: true, trim: true, maxlength: 120 },
  translation: { type: String, required: true, trim: true, maxlength: 200 },
  pronunciation: { type: String, trim: true, maxlength: 120, default: '' },
  example: { type: String, trim: true, maxlength: 300, default: '' }
}, { _id: false });

const exampleSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 300 },
  translation: { type: String, trim: true, maxlength: 300, default: '' }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  language: { type: String, required: true, trim: true, maxlength: 40 },
  level: { type: String, enum: LEVELS, default: 'A1' },
  topic: { type: String, trim: true, maxlength: 80, default: '' },
  estimatedMinutes: { type: Number, default: 10, min: 1, max: 120 },
  xpReward: { type: Number, default: 20, min: 0, max: 500 },
  order: { type: Number, default: 1000 },                    // curriculum order within a language
  content: {
    vocabulary: {
      type: [vocabSchema],
      validate: { validator: v => v.length >= 1 && v.length <= 60, message: 'A lesson needs 1 to 60 vocabulary items.' }
    },
    grammar: {
      title: { type: String, trim: true, maxlength: 120, default: '' },
      explanation: { type: String, trim: true, maxlength: 2000, default: '' }
    },
    examples: { type: [exampleSchema], default: [] },
    tip: { type: String, trim: true, maxlength: 500, default: '' }
  },
  published: { type: Boolean, default: true },
  source: { type: String, enum: ['teacher', 'ai', 'curriculum'], default: 'teacher' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

lessonSchema.index({ language: 1, order: 1, createdAt: 1 });
lessonSchema.index({ title: 1, language: 1, source: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
module.exports.LEVELS = LEVELS;
