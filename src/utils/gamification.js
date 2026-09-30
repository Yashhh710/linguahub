// Pure gamification rules (no database access) so they are easy to unit test.
const { shiftDay } = require('./dates');

/** Level n starts at 100 * (n-1)^2 XP: 0, 100, 400, 900, 1600 ... */
const levelFromXp = xp => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
const xpForLevel = level => 100 * (level - 1) ** 2;

function levelInfo(xp = 0) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { xp, level, xpIntoLevel: xp - floor, xpForNextLevel: next - floor };
}

/** Register activity on `today`; returns the new streak state. */
function applyActivity(state, today) {
  if (state.lastActiveDay === today) return { ...state, changed: false };
  const previousStreak = state.currentStreak || 0;
  const freezesAvailable = state.freezesAvailable || 0;
  let current;
  let remainingFreezes = freezesAvailable;
  let protectedDay = null;

  if (state.lastActiveDay === shiftDay(today, -1)) {
    current = previousStreak + 1;
  } else if (state.lastActiveDay === shiftDay(today, -2) && freezesAvailable > 0) {
    current = previousStreak + 2;
    remainingFreezes--;
    protectedDay = shiftDay(today, -1);
  } else {
    current = 1;
  }

  if (Math.floor(current / 7) > Math.floor(previousStreak / 7)) {
    remainingFreezes = Math.min(1, remainingFreezes + 1);
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(state.longestStreak || 0, current),
    lastActiveDay: today,
    freezesAvailable: remainingFreezes,
    protectedDay,
    changed: true
  };
}

/** The streak a learner should SEE today: it is broken if they skipped yesterday and haven't practised yet. */
function effectiveStreak(state, today) {
  if (!state || !state.lastActiveDay) return 0;
  if (state.lastActiveDay === today || state.lastActiveDay === shiftDay(today, -1)) return state.currentStreak;
  if (state.lastActiveDay === shiftDay(today, -2) && state.freezesAvailable > 0) return state.currentStreak;
  return 0;
}

module.exports = { levelFromXp, xpForLevel, levelInfo, applyActivity, effectiveStreak };
