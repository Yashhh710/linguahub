import { icon } from './icons.js';
import { state } from './state.js';
import { clearSession } from './api.js';

const NAV = [
  ['#/dashboard', 'home', 'Home'],
  ['#/lessons', 'learn', 'Lessons'],
  ['#/quizzes', 'practice', 'Practice'],
  ['#/progress', 'progress', 'Progress'],
  ['#/friends', 'friends', 'Friends'],
  ['#/achievements', 'star', 'Achievements']
];

function navHtml(current, mobile = false) {
  const items = NAV.map(([href, ic, label]) =>
    `<a href="${href}" class="${current.startsWith(href) ? 'active' : ''}">${icon(ic, mobile ? 19 : 19)}<span>${label}</span></a>`
  ).join('');
  const role = state.user?.role;
  const extra = (role === 'teacher' || role === 'admin')
    ? `<a href="#/studio" class="${current.startsWith('#/studio') ? 'active' : ''}">${icon('studio')}<span>Studio</span></a>` : '';
  const adminLink = role === 'admin'
    ? `<a href="#/admin" class="${current.startsWith('#/admin') ? 'active' : ''}">${icon('admin')}<span>Admin</span></a>` : '';
  return items + extra + adminLink;
}

export function renderShell(activeHash, title, eyebrow) {
  const isDashboard = activeHash === '#/dashboard';
  const u = state.user || {};
  const initial = (u.name || '?').trim()[0]?.toUpperCase() || '?';
  const avatarContent = u.avatar
    ? `<img class="avatar-photo" src="${escapeHtml(u.avatar)}" alt="">`
    : escapeHtml(initial);
  document.getElementById('app').innerHTML = `
    <div class="shell${isDashboard ? ' dashboard-shell' : ''}">
      <aside class="sidebar">
        <a class="brand" href="#/dashboard"><span class="brand-mark">L</span><span class="brand-name">LinguaHub</span></a>
        <nav class="side-nav">${navHtml(activeHash)}</nav>
        <div class="side-foot">
          <div class="streak-pill">${icon('flame', 18)} <span id="streakLabel">${state.streak || 0} day streak</span></div>
          <a href="#/profile" class="profile-chip" style="margin-top:10px;width:100%">
            <span class="avatar">${avatarContent}</span>
            <span style="font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name || ''}</span>
          </a>
        </div>
      </aside>
      <main class="main">
        <header class="topbar${isDashboard ? ' dashboard-topbar' : ''}">
          <div><div class="eyebrow">${eyebrow || ''}</div><h1>${title}</h1></div>
          ${isDashboard ? `<div class="dashboard-search-wrap" role="search">
            <label class="dashboard-search" for="dashboardSearch">${icon('search', 17)}<input id="dashboardSearch" type="search" placeholder="Search lessons" aria-label="Search lessons" autocomplete="off"><kbd>Enter</kbd></label>
            <div class="dashboard-search-results" id="dashboardSearchResults" role="listbox" hidden></div>
          </div>` : ''}
          <div class="top-actions">
            ${isDashboard ? `<div class="dashboard-top-stat"><span class="top-stat-icon streak-stat">${icon('flame', 16)}</span><span><strong>${state.streak || 0}</strong><small>day streak</small></span></div>
              <div class="dashboard-top-stat"><span class="top-stat-icon xp-stat">${icon('bolt', 16)}</span><span><strong>${u.xp ?? 0}</strong><small>XP points</small></span></div>
              <div class="dashboard-notifications"><button id="dashboardNotificationToggle" class="notification-button" type="button" aria-label="Notifications" aria-expanded="false" aria-controls="dashboardNotificationPanel">${icon('bell', 18)}<span class="notification-dot" id="dashboardNotificationDot" hidden></span></button><div id="dashboardNotificationPanel" class="notification-panel" hidden></div></div>
              <a href="#/profile" class="dashboard-profile" aria-label="Open profile for ${escapeHtml(u.name || 'your account')}"><span class="avatar">${avatarContent}</span><span class="dashboard-profile-name">${escapeHtml(u.name || 'Profile')}</span>${icon('chevronRight', 14)}</a>` : `<span class="pill amber">${icon('bolt', 14)} ${u.xp ?? 0} XP</span>
              <span class="pill">Lv ${u.level ?? 1}</span>`}
          </div>
        </header>
        <div class="content" id="view"></div>
      </main>
    </div>
    <nav class="mobile-nav">${navHtml(activeHash, true)}</nav>
  `;
  return document.getElementById('view');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

export function signOut() {
  clearSession();
  location.hash = '#/login';
  location.reload();
}
