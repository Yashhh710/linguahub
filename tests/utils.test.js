const test = require('node:test');
const assert = require('node:assert/strict');
const { dayKey, shiftDay, lastDays } = require('../src/utils/dates');
const { levelFromXp, xpForLevel, applyActivity, effectiveStreak } = require('../src/utils/gamification');
const { score, normalize } = require('../src/utils/similarity');

test('dayKey formats in a given timezone', () => {
  const d = new Date('2026-01-15T23:30:00Z');
  assert.equal(dayKey(d, 'UTC'), '2026-01-15');
  assert.equal(dayKey(d, 'Pacific/Kiritimati'), '2026-01-16'); // UTC+14
});

test('shiftDay and lastDays', () => {
  assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
  assert.deepEqual(lastDays('2026-01-03', 3), ['2026-01-01', '2026-01-02', '2026-01-03']);
});

test('levelFromXp thresholds', () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(99), 1);
  assert.equal(levelFromXp(100), 2);
  assert.equal(levelFromXp(400), 3);
  assert.equal(xpForLevel(3), 400);
});

test('applyActivity extends a consecutive-day streak', () => {
  const state = { currentStreak: 5, longestStreak: 5, lastActiveDay: '2026-01-01' };
  const r = applyActivity(state, '2026-01-02');
  assert.equal(r.currentStreak, 6);
  assert.equal(r.changed, true);
});

test('applyActivity resets after a gap', () => {
  const state = { currentStreak: 5, longestStreak: 5, lastActiveDay: '2026-01-01' };
  const r = applyActivity(state, '2026-01-05');
  assert.equal(r.currentStreak, 1);
});

test('applyActivity is a no-op for a second activity same day', () => {
  const state = { currentStreak: 3, longestStreak: 3, lastActiveDay: '2026-01-02' };
  const r = applyActivity(state, '2026-01-02');
  assert.equal(r.changed, false);
  assert.equal(r.currentStreak, 3);
});

test('applyActivity awards one freeze at a seven-day milestone', () => {
  const state = { currentStreak: 6, longestStreak: 6, lastActiveDay: '2026-01-01', freezesAvailable: 0 };
  const r = applyActivity(state, '2026-01-02');
  assert.equal(r.currentStreak, 7);
  assert.equal(r.freezesAvailable, 1);
});

test('a protected day counts toward a seven-day milestone', () => {
  const state = { currentStreak: 5, longestStreak: 5, lastActiveDay: '2026-01-01', freezesAvailable: 1 };
  const r = applyActivity(state, '2026-01-03');
  assert.equal(r.currentStreak, 7);
  assert.equal(r.freezesAvailable, 1);
});

test('applyActivity uses a freeze to bridge exactly one missed day', () => {
  const state = { currentStreak: 9, longestStreak: 9, lastActiveDay: '2026-01-01', freezesAvailable: 1 };
  const r = applyActivity(state, '2026-01-03');
  assert.equal(r.currentStreak, 11);
  assert.equal(r.freezesAvailable, 0);
  assert.equal(r.protectedDay, '2026-01-02');
});

test('applyActivity does not consume a freeze after multiple missed days', () => {
  const state = { currentStreak: 5, longestStreak: 5, lastActiveDay: '2026-01-01', freezesAvailable: 1 };
  const r = applyActivity(state, '2026-01-04');
  assert.equal(r.currentStreak, 1);
  assert.equal(r.freezesAvailable, 1);
  assert.equal(r.protectedDay, null);
});

test('applyActivity caps banked freezes at one', () => {
  const state = { currentStreak: 6, longestStreak: 6, lastActiveDay: '2026-01-01', freezesAvailable: 1 };
  const r = applyActivity(state, '2026-01-02');
  assert.equal(r.freezesAvailable, 1);
});

test('effectiveStreak shows 0 once a day is missed without new activity', () => {
  const state = { currentStreak: 4, longestStreak: 4, lastActiveDay: '2026-01-01' };
  assert.equal(effectiveStreak(state, '2026-01-02'), 4); // still valid, same or next day
  assert.equal(effectiveStreak(state, '2026-01-03'), 0); // missed a day
});

test('effectiveStreak remains visible when a freeze can cover one missed day', () => {
  const state = { currentStreak: 4, lastActiveDay: '2026-01-01', freezesAvailable: 1 };
  assert.equal(effectiveStreak(state, '2026-01-03'), 4);
});

test('similarity scores an exact match as 100', () => {
  assert.equal(score('Buenos días', 'buenos dias'), 100); // accent-insensitive
});

test('similarity scores a rough match lower', () => {
  const s = score('Buenos días', 'buenas noches');
  assert.ok(s < 60, `expected a low score, got ${s}`);
});

test('normalize strips punctuation and accents', () => {
  assert.equal(normalize('¿Dónde está?'), 'donde esta');
});
