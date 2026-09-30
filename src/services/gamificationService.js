const User = require('../models/User');
const Streak = require('../models/Streak');
const XpEvent = require('../models/XpEvent');
const { dayKey } = require('../utils/dates');
const { applyActivity } = require('../utils/gamification');
const { checkAndUnlockAchievements } = require('./achievementService');

/**
 * Central place XP is ever awarded from. Updates the user's XP total, the day's streak,
 * logs an XpEvent (for charts/leaderboards), unlocks any newly-earned achievements, and
 * emits realtime events so open tabs update without a refresh.
 */
async function awardXp(io, { userId, xp, source, ref = '', label = '', language = '' }) {
  const user = await User.findById(userId);
  if (!user) return null;

  if (xp > 0) {
    user.xp += xp;
    await user.save();
    await XpEvent.create({ user: userId, xp, source, ref, label, language });
  }

  const today = dayKey(new Date(), user.timezone);
  const streak = await Streak.findOne({ user: userId }) || new Streak({ user: userId, currentStreak: 0, longestStreak: 0, lastActiveDay: '', days: [] });
  const result = applyActivity(streak, today);
  if (result.changed) {
    streak.currentStreak = result.currentStreak;
    streak.longestStreak = result.longestStreak;
    streak.freezesAvailable = result.freezesAvailable;
    streak.lastActiveDay = result.lastActiveDay;
    streak.days = [...new Set([...streak.days, today])].slice(-400);
    if (result.protectedDay) {
      streak.protectedDays = [...new Set([...streak.protectedDays, result.protectedDay])].slice(-400);
    }
    await streak.save();
  }

  const unlocked = await checkAndUnlockAchievements(userId, { xp: user.xp, streak: streak.currentStreak, source });

  const payload = { userId: String(userId), xp: user.xp, xpGained: xp, currentStreak: streak.currentStreak, longestStreak: streak.longestStreak, unlocked };
  if (io) io.to(`user:${userId}`).emit('xpUpdated', payload);
  return payload;
}

module.exports = { awardXp };
