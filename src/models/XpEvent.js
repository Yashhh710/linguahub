const mongoose = require('mongoose');

// Ledger of every XP award. Powers weekly charts, the weekly leaderboard and anti-farming checks.
const xpEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  xp: { type: Number, required: true },
  source: { type: String, enum: ['lesson', 'quiz', 'voice'], required: true },
  ref: { type: String, default: '' },                        // lessonId / quizId / phrase key
  label: { type: String, default: '' },                      // human title shown in activity feeds
  language: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

xpEventSchema.index({ user: 1, createdAt: -1 });
xpEventSchema.index({ createdAt: -1, language: 1 });
xpEventSchema.index({ user: 1, source: 1, ref: 1 });

module.exports = mongoose.model('XpEvent', xpEventSchema);
