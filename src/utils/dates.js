// Day-boundary helpers. Streaks and daily charts follow the LEARNER's timezone, not the server's.
const formatters = new Map();

function safeTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch { return 'UTC'; }
}

/** 'YYYY-MM-DD' for the given instant in the given IANA timezone. */
function dayKey(date = new Date(), tz = 'UTC') {
  const zone = safeTimezone(tz || 'UTC');
  if (!formatters.has(zone)) {
    formatters.set(zone, new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }));
  }
  return formatters.get(zone).format(date);
}

/** Add/subtract whole days from a 'YYYY-MM-DD' key. */
function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** Hour of day (0-23) for the instant in the given timezone. */
function hourIn(date, tz) {
  const h = new Intl.DateTimeFormat('en-GB', { timeZone: safeTimezone(tz || 'UTC'), hour: '2-digit', hourCycle: 'h23' }).format(date);
  return Number(h) % 24;
}

/** Last n day keys ending at (and including) endKey, oldest first. */
function lastDays(endKey, n) {
  return Array.from({ length: n }, (_, i) => shiftDay(endKey, i - (n - 1)));
}

module.exports = { dayKey, shiftDay, hourIn, lastDays, safeTimezone };
