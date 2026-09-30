const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Progress = require('../models/Progress');
const Friendship = require('../models/Friendship');

/** Checks the learner's stats against the achievement catalog and unlocks any newly-earned badges. */
async function checkAndUnlockAchievements(userId, stats) {
  const catalog = await Achievement.find().lean();
  if (!catalog.length) return [];

  const already = new Set((await UserAchievement.find({ user: userId }).lean()).map(a => String(a.achievement)));
  const candidates = catalog.filter(a => !already.has(String(a._id)));
  if (!candidates.length) return [];

  const lessonsCompleted = candidates.some(a => a.category === 'lessons')
    ? await Progress.countDocuments({ user: userId, completed: true }) : 0;
  const friendCount = candidates.some(a => a.category === 'social')
    ? await Friendship.countDocuments({ status: 'accepted', $or: [{ requester: userId }, { recipient: userId }] }) : 0;

  const progressFor = category => ({
    streak: stats.streak || 0,
    xp: stats.xp || 0,
    lessons: lessonsCompleted,
    quiz: stats.quizzesPassed ?? 0,
    social: friendCount
  }[category] || 0);

  const unlocked = [];
  for (const achievement of candidates) {
    if (progressFor(achievement.category) >= achievement.goal) {
      try {
        await UserAchievement.create({ user: userId, achievement: achievement._id });
        unlocked.push({ key: achievement.key, title: achievement.title, description: achievement.description, icon: achievement.icon });
      } catch { /* race with a concurrent request; unique index already recorded it */ }
    }
  }
  return unlocked;
}

module.exports = { checkAndUnlockAchievements };
