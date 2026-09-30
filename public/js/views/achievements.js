import { get, put } from '../api.js';
import { renderShell } from '../shell.js';
import { skeletonFor } from '../skeleton.js';
import { icon } from '../icons.js';
import { showToast } from '../toast.js';

const ICONS = { star: 'star', diamond: 'sparkles', book: 'learn', check: 'check', friends: 'friends' };
const CATEGORIES = [
  ['all', 'All badges'],
  ['streak', 'Streak'],
  ['xp', 'XP'],
  ['lessons', 'Lessons'],
  ['quiz', 'Quizzes'],
  ['social', 'Social']
];

export async function renderAchievements() {
  const view = renderShell('#/achievements', 'Achievements', 'Every lesson brings you closer to a milestone');
  view.innerHTML = skeletonFor('achievements');

  let badges = [];
  let progress = {};
  let notifications = [];
  let leaderboardRows = [];
  let user = {};
  let category = 'all';
  let badgeStatus = 'all';
  let badgeSearch = '';
  let leaderboardPeriod = 'week';

  async function load() {
    const results = await Promise.allSettled([
      get('/achievements/me'),
      get('/progress'),
      get('/notifications'),
      get(`/leaderboard?scope=global&period=${leaderboardPeriod}`),
      get('/auth/me')
    ]);
    badges = results[0].status === 'fulfilled' ? results[0].value : [];
    progress = results[1].status === 'fulfilled' ? results[1].value : {};
    notifications = results[2].status === 'fulfilled' ? results[2].value : [];
    leaderboardRows = results[3].status === 'fulfilled' ? results[3].value.rows || [] : [];
    user = results[4].status === 'fulfilled' ? results[4].value : {};
    if (results[0].status === 'rejected') showToast(results[0].reason.message);
    draw();
  }

  function draw() {
    const unlockedCount = badges.filter(badge => badge.unlocked).length;
    const unreadCount = notifications.filter(notification => !notification.read).length;
    const currentXp = Number(user.xp || 0);
    const currentStreak = Number(progress.currentStreak || 0);
    const lessonsCompleted = Number(progress.lessonsCompleted || 0);
    const myRank = leaderboardRows.find(row => row.isMe);
    const maxWeeklyXp = Math.max(1, ...(progress.weekly || []).map(day => Number(day.xp || 0)));
    const shownBadges = badges.filter(badge => {
      const matchesCategory = category === 'all' || badge.category === category;
      const matchesStatus = badgeStatus === 'all' || (badgeStatus === 'unlocked' ? badge.unlocked : !badge.unlocked);
      const matchesSearch = `${badge.title} ${badge.description}`.toLowerCase().includes(badgeSearch.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
    }).sort((first, second) => Number(Boolean(second.unlocked)) - Number(Boolean(first.unlocked)));

    view.innerHTML = `
      <div class="achievements-dashboard">
        <div class="achievements-layout">
          <main class="achievements-main">
            <section class="achievements-hero card">
              <div class="achievements-hero-copy">
                <span class="achievements-kicker">Your learning milestones</span>
                <h2>Your achievements</h2>
                <p>Small steps add up. See what youâ€™ve earned and what youâ€™re working toward.</p>
                <div class="achievements-hero-stats">
                  <div><span>${unlockedCount}</span><small>Badges earned</small></div>
                  <div><span>${currentStreak}</span><small>Day streak</small></div>
                  <div><span>${lessonsCompleted}</span><small>Lessons done</small></div>
                  <div><span>${formatNumber(currentXp)}</span><small>Total XP</small></div>
                </div>
              </div>
              <img class="achievements-hero-art" src="/assets/achivments.png" alt="" aria-hidden="true">
            </section>

            <section class="card achievements-badges-panel">
              <div class="achievements-section-heading">
                <div>
                  <span class="achievements-section-kicker">Milestones</span>
                  <h2>Badges &amp; achievements</h2>
                </div>
                <span class="achievements-total">${unlockedCount} / ${badges.length} unlocked</span>
              </div>
              <div class="achievements-toolbar">
                <div class="achievement-category-tabs" role="group" aria-label="Filter badge category">
                  ${CATEGORIES.map(([value, label]) => `<button class="${category === value ? 'active' : ''}" type="button" data-category="${value}">${label}</button>`).join('')}
                </div>
                <div class="achievement-filters">
                  <label class="achievement-search"><span class="sr-only">Search badges</span><input id="badgeSearch" type="search" value="${escapeHtml(badgeSearch)}" placeholder="Search badges"></label>
                  <select id="badgeStatus" aria-label="Filter badge status">
                    <option value="all" ${badgeStatus === 'all' ? 'selected' : ''}>All statuses</option>
                    <option value="unlocked" ${badgeStatus === 'unlocked' ? 'selected' : ''}>Unlocked</option>
                    <option value="locked" ${badgeStatus === 'locked' ? 'selected' : ''}>Locked</option>
                  </select>
                </div>
              </div>
              <div class="achievement-card-grid">
                ${shownBadges.length ? shownBadges.map(badge => `
                  <article class="achievement-badge-card ${badge.unlocked ? 'is-unlocked' : 'is-locked'}">
                    <span class="achievement-badge-icon">${icon(ICONS[badge.icon] || 'star', 21)}</span>
                    <div class="achievement-badge-copy">
                      <h3>${escapeHtml(badge.title)}</h3>
                      <p>${escapeHtml(badge.description)}</p>
                    </div>
                    <div class="achievement-badge-footer">
                      <span class="achievement-status">${badge.unlocked ? 'Unlocked' : `Target: ${formatNumber(badge.goal)}`}</span>
                      ${badge.unlockedAt ? `<time datetime="${escapeHtml(badge.unlockedAt)}">${formatDate(badge.unlockedAt)}</time>` : ''}
                    </div>
                  </article>
                `).join('') : '<p class="achievement-empty">No badges match these filters.</p>'}
              </div>
            </section>

            <div class="achievements-progress-grid">
              <section class="card achievement-weekly-panel">
                <div class="achievements-section-heading compact">
                  <div><span class="achievements-section-kicker">Last 7 days</span><h2>XP earned</h2></div>
                  <strong>${formatNumber((progress.weekly || []).reduce((sum, day) => sum + Number(day.xp || 0), 0))} XP</strong>
                </div>
                <div class="achievement-week-chart" aria-label="Weekly XP activity">
                  ${(progress.weekly || []).map(day => {
                    const height = Math.round(Number(day.xp || 0) / maxWeeklyXp * 100);
                    return `<div class="achievement-week-day" title="${escapeHtml(formatDay(day.day))}: ${formatNumber(day.xp || 0)} XP"><div class="achievement-week-bar"><span style="height:${height}%"></span></div><small>${escapeHtml(formatDay(day.day))}</small></div>`;
                  }).join('') || '<p class="achievement-empty">Weekly XP activity will appear here.</p>'}
                </div>
              </section>
              <section class="card achievement-progress-panel">
                <div class="achievements-section-heading compact">
                  <div><span class="achievements-section-kicker">Your learning</span><h2>Course progress</h2></div>
                  <strong>${Number(progress.overallPercent || 0)}%</strong>
                </div>
                <div class="achievement-progress-track" role="progressbar" aria-label="Course completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(progress.overallPercent || 0)}"><span style="width:${Math.max(0, Math.min(100, Number(progress.overallPercent || 0)))}%"></span></div>
                <div class="achievement-progress-stats">
                  <span>${lessonsCompleted} / ${Number(progress.lessonsTotal || 0)} lessons complete</span>
                  <span>${Number(progress.quizzesPassed || 0)} quizzes passed</span>
                  <span>${Number(progress.quizAccuracy || 0)}% quiz accuracy</span>
                  <span>Best streak: ${Number(progress.longestStreak || 0)} days</span>
                </div>
                <a class="achievement-text-link" href="#/progress">View progress ${icon('chevronRight', 13)}</a>
              </section>
            </div>
          </main>

          <aside class="achievements-sidebar">
            <section class="card achievements-notifications-panel">
              <div class="achievements-section-heading compact">
                <div><span class="achievements-section-kicker">Your account</span><h2>Recent notifications</h2></div>
                <span class="achievement-unread-count">${unreadCount}</span>
              </div>
              <div class="achievement-notification-tools">
                <span>${unreadCount ? `${unreadCount} unread` : 'All caught up'}</span>
                <button type="button" data-read-all ${unreadCount ? '' : 'disabled'}>Mark all read</button>
              </div>
              <div class="achievement-notification-list">
                ${notifications.length ? notifications.slice(0, 6).map(notification => `
                  <button class="achievement-notification ${notification.read ? '' : 'is-unread'}" type="button" data-notification-id="${escapeHtml(notification._id)}" aria-label="${notification.read ? 'Read' : 'Mark read'}: ${escapeHtml(notification.title)}">
                    <span class="achievement-notification-icon">${icon(notification.type === 'achievement' ? 'star' : notification.type === 'reminder' ? 'sparkles' : 'bell', 14)}</span>
                    <span class="achievement-notification-copy"><strong>${escapeHtml(notification.title)}</strong><small>${escapeHtml(notification.body)}</small><time>${timeAgo(notification.createdAt)}</time></span>
                    ${notification.read ? '' : '<span class="achievement-unread-dot"></span>'}
                  </button>
                `).join('') : '<p class="achievement-empty">No notifications yet.</p>'}
              </div>
            </section>

            <section class="card achievements-leaderboard-panel">
              <div class="achievements-section-heading compact">
                <div><span class="achievements-section-kicker">Learn together</span><h2>Leaderboard</h2></div>
                <a class="achievement-text-link" href="#/friends" aria-label="Open friends">${icon('chevronRight', 14)}</a>
              </div>
              <div class="achievement-leaderboard-tabs" role="group" aria-label="Leaderboard period">
                <button class="${leaderboardPeriod === 'week' ? 'active' : ''}" type="button" data-period="week">This week</button>
                <button class="${leaderboardPeriod === 'alltime' ? 'active' : ''}" type="button" data-period="alltime">All time</button>
              </div>
              <ol class="achievement-leaderboard-list">
                ${leaderboardRows.length ? leaderboardRows.slice(0, 5).map((row, index) => `
                  <li class="achievement-leaderboard-row ${row.isMe ? 'is-me' : ''}">
                    <span class="achievement-rank">${row.rank || index + 1}</span>
                    <span class="achievement-avatar">${row.avatar ? `<img class="avatar-photo" src="${escapeHtml(row.avatar)}" alt="">` : escapeHtml((row.name || '?').trim()[0]?.toUpperCase() || '?')}</span>
                    <span class="achievement-learner">${escapeHtml(row.isMe ? 'You' : row.name)}</span>
                    <strong>${formatNumber(row.xp || 0)} <small>XP</small></strong>
                  </li>
                `).join('') : '<li class="achievement-empty">No leaderboard data yet.</li>'}
              </ol>
              ${myRank ? `<p class="achievement-your-rank">Your rank: <strong>#${myRank.rank}</strong></p>` : ''}
            </section>

            <a class="achievement-practice-banner" href="#/lessons">
              <span class="achievement-practice-copy"><strong>Keep your momentum</strong><small>Every lesson brings a new chance to grow.</small><span>Continue learning ${icon('chevronRight', 13)}</span></span>
              <img src="/cute/cute-1.png" alt="">
            </a>
          </aside>
        </div>
      </div>
    `;

    view.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => {
        category = button.dataset.category;
        draw();
      });
    });
    view.querySelector('#badgeStatus').addEventListener('change', event => {
      badgeStatus = event.currentTarget.value;
      draw();
    });
    view.querySelector('#badgeSearch').addEventListener('input', event => {
      badgeSearch = event.currentTarget.value;
      const selectionStart = event.currentTarget.selectionStart;
      draw();
      const search = view.querySelector('#badgeSearch');
      search.focus();
      search.setSelectionRange(selectionStart, selectionStart);
    });
    view.querySelectorAll('[data-period]').forEach(button => {
      button.addEventListener('click', async () => {
        leaderboardPeriod = button.dataset.period;
        await load();
      });
    });
    view.querySelector('[data-read-all]').addEventListener('click', markAllRead);
    view.querySelectorAll('[data-notification-id]').forEach(button => {
      button.addEventListener('click', () => markRead(button.dataset.notificationId));
    });
  }

  async function markRead(id) {
    const notification = notifications.find(item => item._id === id);
    if (!notification || notification.read) return;
    try {
      await put(`/notifications/${id}/read`);
      notification.read = true;
      draw();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function markAllRead() {
    if (!notifications.some(notification => !notification.read)) return;
    try {
      await put('/notifications/read-all');
      notifications.forEach(notification => { notification.read = true; });
      draw();
    } catch (error) {
      showToast(error.message);
    }
  }

  await load();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatDay(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of ranges) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, 'second');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

