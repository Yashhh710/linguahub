import { getToken, getCachedUser, get } from './api.js';
import { state, setUser, setStreak } from './state.js';
import { route } from './router.js';
import { announceGains, showToast } from './toast.js';

let socket = null;
const STARTUP_FRAME_COUNT = 66;
const STARTUP_FRAME_INTERVAL_MS = 40;

function playStartupSequence() {
  const screen = document.getElementById('startupSequence');
  if (!screen) return Promise.resolve();
  const display = screen.querySelector('#startupFrame');
  if (!display) return Promise.resolve();

  const frames = Array.from({ length: STARTUP_FRAME_COUNT }, (_, index) =>
    `/assets/loading-frames/${String(index + 1).padStart(4, '0')}.jpg`
  );
  const images = frames.map(source => {
    const image = new Image();
    image.src = source;
    return image;
  });

  const preloadFrames = Promise.all(images.map(image => new Promise(resolve => {
    if (image.complete) resolve();
    else {
      image.onload = resolve;
      image.onerror = resolve;
    }
  })));

  return preloadFrames.then(() => new Promise(resolve => {
    let lastFrameIndex = 0;
    const sequenceStartedAt = performance.now();

    const advance = () => {
      const targetIndex = Math.min(
        images.length - 1,
        Math.floor((performance.now() - sequenceStartedAt) / STARTUP_FRAME_INTERVAL_MS)
      );
      if (targetIndex > lastFrameIndex) {
        lastFrameIndex = targetIndex;
        display.src = frames[targetIndex];
      }

      if (targetIndex >= images.length - 1) {
        resolve();
        return;
      }

      window.setTimeout(advance, STARTUP_FRAME_INTERVAL_MS);
    };

    advance();
  }));
}

function connectSocket() {
  if (socket || !window.io) return;
  socket = window.io();
  socket.on('connect', () => socket.emit('authenticate', getToken()));
  socket.on('xpUpdated', payload => {
    if (state.user) state.user.xp = payload.xp;
    setStreak(payload.currentStreak);
    const streakLabel = document.getElementById('streakLabel');
    if (streakLabel) streakLabel.textContent = `${payload.currentStreak} day streak`;
    announceGains({ xpGained: 0, unlocked: payload.unlocked }); // xp toast already shown by the action that triggered it
  });
  socket.on('friendRequest', payload => {
    showToast('You have a new friend request');
    window.dispatchEvent(new CustomEvent('linguahub:friends-changed', { detail: { type: 'request', ...payload } }));
  });
  socket.on('friendAccepted', payload => {
    showToast('A friend request was accepted');
    window.dispatchEvent(new CustomEvent('linguahub:friends-changed', { detail: { type: 'accepted', ...payload } }));
  });
  socket.on('notification', n => showToast(n.title));
}

async function refreshSession() {
  try {
    // Fetch both in parallel instead of one after the other.
    const [fresh, streak] = await Promise.all([get('/auth/me'), get('/streaks')]);
    setUser(fresh);
    localStorage.setItem('lh_user', JSON.stringify(fresh));
    setStreak(streak.currentStreak);
    connectSocket();
  } catch {
    // api.js already redirects to #/login on 401; nothing else to do here.
  }
}

async function bootstrap() {
  const startupSequence = playStartupSequence();
  const cached = getCachedUser();
  if (cached) setUser(cached);

  if (getToken()) await refreshSession();

  // Start drawing the page (shell + skeleton) right away; don't wait for its data to hide the intro.
  const routed = route().catch(error => console.error(error));
  await startupSequence;

  const startupScreen = document.getElementById('startupSequence');
  if (startupScreen) {
    startupScreen.classList.add('is-hidden');
    window.setTimeout(() => startupScreen.remove(), 450);
  }
  await routed;
}

function setupScrollToTop() {
  const btn = document.getElementById('scrollToTopBtn');
  if (!btn) return;
  const toggleVisibility = () => {
    if (window.scrollY > 260) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  window.addEventListener('scroll', toggleVisibility, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  toggleVisibility();
}

window.addEventListener('hashchange', () => {
  route();
  // Scroll to top upon navigating routes
  window.scrollTo({ top: 0, behavior: 'instant' });
});
setupScrollToTop();
bootstrap();
