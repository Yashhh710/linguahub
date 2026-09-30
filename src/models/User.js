const mongoose = require('mongoose');
const { levelInfo } = require('../utils/gamification');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },                // bcrypt hash; absent for Google-only accounts
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  firebaseUid: { type: String, index: true, sparse: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  nativeLanguage: { type: String, default: 'English', trim: true, maxlength: 40 },
  learningLanguages: { type: [String], default: [] },
  avatar: { type: String, default: '', maxlength: 150000 },
  dailyGoalMinutes: { type: Number, default: 15, min: 5, max: 240 },
  timezone: { type: String, default: 'UTC' },
  xp: { type: Number, default: 0, min: 0 },
  reminder: {
    enabled: { type: Boolean, default: false },
    hour: { type: Number, default: 18, min: 0, max: 23 },  // learner-local hour
    lastSentDay: { type: String, default: '' }
  },
  fcmTokens: { type: [String], default: [], select: false }
}, { timestamps: true });

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    authProvider: this.authProvider,
    nativeLanguage: this.nativeLanguage,
    learningLanguages: this.learningLanguages,
    avatar: this.avatar || '',
    dailyGoalMinutes: this.dailyGoalMinutes,
    timezone: this.timezone,
    reminder: { enabled: this.reminder?.enabled || false, hour: this.reminder?.hour ?? 18 },
    createdAt: this.createdAt,
    ...levelInfo(this.xp)
  };
};

module.exports = mongoose.model('User', userSchema);
