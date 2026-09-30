const mongoose = require('mongoose');

// Static catalog of unlockable badges. Seeded once; admins can add more.
const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },   // stable machine id, e.g. 'streak_7'
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  icon: { type: String, default: 'star' },
  category: { type: String, enum: ['streak', 'xp', 'lessons', 'quiz', 'social'], required: true },
  goal: { type: Number, required: true, min: 1 }                      // threshold this badge tracks
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
