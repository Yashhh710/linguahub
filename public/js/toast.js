export function showToast(message, kind = '') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`.trim();
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/** Renders the gains object returned by awardXp (xpGained, unlocked achievements) as toasts. */
export function announceGains(gains) {
  if (!gains) return;
  if (gains.xpGained) showToast(`+${gains.xpGained} XP`, 'xp');
  for (const badge of gains.unlocked || []) showToast(`Achievement unlocked: ${badge.title}`, 'achievement');
}
