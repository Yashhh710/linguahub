const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0, min: 0 },
  longestStreak: { type: Number, default: 0, min: 0 },
  freezesAvailable: { type: Number, default: 0, min: 0, max: 1 },
  lastActiveDay: { type: String, default: '' },              // 'YYYY-MM-DD' in the learner's timezone
  days: { type: [String], default: [] },                     // every active day (most recent 400 kept)
  protectedDays: { type: [String], default: [] }              // missed days covered by a freeze
}, { timestamps: true });

module.exports = mongoose.model('Streak', streakSchema);
