// Tiny pub-sub store for the signed-in user + live streak/xp, shared across views and the shell.
const listeners = new Set();
export const state = { user: null, streak: 0 };

export function setUser(user) { state.user = user; state.streak = user?.currentStreak ?? state.streak; notify(); }
export function setStreak(n) { state.streak = n; notify(); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach(fn => fn(state)); }
