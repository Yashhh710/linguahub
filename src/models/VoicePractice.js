const mongoose = require('mongoose');

// A log of speaking-practice attempts scored client-side (Web Speech API) and reported to the server for XP + history.
const voicePracticeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  language: { type: String, required: true, trim: true },
  expectedText: { type: String, required: true, trim: true, maxlength: 300 },
  heardText: { type: String, trim: true, maxlength: 300, default: '' },
  accuracy: { type: Number, required: true, min: 0, max: 100 },
  xpEarned: { type: Number, default: 0 },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('VoicePractice', voicePracticeSchema);
