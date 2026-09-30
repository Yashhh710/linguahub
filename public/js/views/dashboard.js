import { get, put } from '../api.js';
import { renderShell } from '../shell.js';
import { skeletonFor } from '../skeleton.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { announceGains } from '../toast.js';

export async function renderDashboard() {
  const view = renderShell('#/dashboard', 'Home', dayLabel());
  view.innerHTML = skeletonFor('dashboard');

  const [progress, lessons, streak, leaderboard, notifications] = await Promise.all([
    get('/progress'), get('/lessons'), get('/streaks'), get('/leaderboard?period=week').catch(() => ({ rows: [] })),
    get('/notifications').catch(() => [])
  ]).catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });

  const goalMinutes = state.user?.dailyGoalMinutes || 15;
  const todayXp = progress.weekly[progress.weekly.length - 1]?.xp || 0;
  const latestStarted = progress.recent.find(item => item.detail === 'Started lesson');
  const activeLesson = lessons.find(lesson => !lesson.completed && lesson.title === latestStarted?.title)
    || lessons.find(lesson => !lesson.completed)
    || null;
  const recommended = lessons.filter(lesson => !lesson.completed && lesson._id !== activeLesson?._id).slice(0, 2);
  const max = Math.max(1, ...progress.weekly.map(d => d.xp));
  const weekDays = streak.calendar.slice(-7);
  const activeDays = weekDays.filter(day => day.active).length;
  const todayKey = weekDays[weekDays.length - 1]?.day;
  const completedLessonToday = progress.recent.some(item => item.detail === 'Completed lesson'
    && dayKeyFor(item.time, state.user?.timezone) === todayKey);
  const languages = ['Spanish', 'French', 'Japanese', 'German'];
  const languagePhotos = {
    Spanish: '/assets/lesson-photo-spain.jpg',
    French: '/assets/lesson-photo-france.jpg',
    Japanese: '/assets/lesson-photo-japan.jpg',
    German: '/assets/travel.jpg'
  };

  view.innerHTML = `
    <section class="card dashboard-hero">
      <img class="dashboard-hero-image" src="/assets/hero.png" alt="">
      <div class="dashboard-hero-copy">
        <span class="pill" style="background:rgba(255,255,255,.18);color:#fff">Level ${state.user?.level ?? 1}</span>
        <h2 style="color:#fff;font-size:24px;margin-top:12px">Keep your streak alive, ${escapeHtml(firstName())}.</h2>
        <p style="color:rgba(255,255,255,.85);margin-top:8px;max-width:420px">You've earned ${todayXp} XP today toward practicing ${goalMinutes} minutes.</p>
        <a class="btn" style="background:#fff;color:var(--blue);margin-top:16px" href="#/lessons">Continue learning</a>
      </div>
    </section>

    <div class="dashboard-layout">
      <div class="dashboard-main">
        <div class="dashboard-metrics" aria-label="Learning progress">
          <div class="dashboard-metric"><span class="dashboard-metric-icon metric-blue">${icon('progress', 17)}</span><span><strong>${progress.overallPercent}%</strong><small>Course progress</small></span></div>
          <div class="dashboard-metric"><span class="dashboard-metric-icon metric-green">${icon('check', 17)}</span><span><strong>${progress.quizAccuracy || 0}%</strong><small>Quiz accuracy</small></span></div>
        </div>

        <section class="dash-section">
          ${sectionHeading('Continue learning', '<a class="dashboard-text-link" href="#/lessons">All lessons ' + icon('chevronRight', 15) + '</a>')}
          ${activeLesson ? `
            <a class="continue-card" href="#/lessons/${activeLesson._id}">
              <div class="continue-art" style="--course-image:url('${escapeHtml(languagePhotos[activeLesson.language] || '/assets/travel.jpg')}')">
                <span class="continue-language-mark">${escapeHtml(languageCode(activeLesson.language))}</span>
                <span class="continue-art-label">${escapeHtml(activeLesson.language)} · ${escapeHtml(activeLesson.level || 'A1')}</span>
              </div>
              <div class="continue-copy">
                <div class="continue-kicker">UP NEXT <span>${escapeHtml(activeLesson.language)}</span></div>
                <h3>${escapeHtml(activeLesson.title)}</h3>
                <p>${escapeHtml(activeLesson.description || 'Pick up your learning where you left off.')}</p>
                <div class="continue-progress-label"><span>Curriculum progress</span><strong>${progress.overallPercent}%</strong></div>
                <div class="dashboard-progress" role="progressbar" aria-label="Overall curriculum progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.overallPercent}"><span style="width:${progress.overallPercent}%"></span></div>
                <div class="continue-bottom"><span>${progress.lessonsCompleted} of ${progress.lessonsTotal} lessons complete</span><span class="continue-play" aria-hidden="true">${icon('play', 15)}</span></div>
              </div>
            </a>` : `
            <div class="continue-card continue-empty">
              <div class="continue-empty-icon">${icon('check', 24)}</div>
              <div><h3>You're all caught up</h3><p>Explore practice or revisit a lesson to keep your skills fresh.</p><a class="dashboard-text-link" href="#/lessons">Browse lessons ${icon('chevronRight', 15)}</a></div>
            </div>`}
          ${recommended.length ? `<div class="recommended-list" aria-label="Recommended next lessons">${recommended.map(lessonRow).join('')}</div>` : ''}
        </section>

        <section class="dash-section">
          ${sectionHeading('Build your skills', '<a class="dashboard-text-link" href="#/quizzes">Practice ' + icon('chevronRight', 15) + '</a>')}
          <div class="skill-grid">
            ${skillCard('Listening', 'practice', 'Listen for meaning', 'skill-listening', '#/quizzes')}
            ${skillCard('Speaking', 'mic', 'Say it with confidence', 'skill-speaking', '#/lessons')}
            ${skillCard('Vocabulary', 'learn', 'Grow your word bank', 'skill-vocabulary', '#/lessons')}
            ${skillCard('Grammar', 'progress', 'Make every sentence count', 'skill-grammar', '#/lessons')}
          </div>
        </section>

        <section class="dash-section">
          ${sectionHeading('Popular languages', '<a class="dashboard-text-link" href="#/lessons">Explore all ' + icon('chevronRight', 15) + '</a>')}
          <div class="language-grid">
            ${languages.map(language => languageCard(language, lessons, languagePhotos[language])).join('')}
          </div>
        </section>

        <section class="dash-section">
          ${sectionHeading('This week', '<a class="dashboard-text-link" href="#/progress">View progress ' + icon('chevronRight', 15) + '</a>')}
          <div class="dashboard-panel xp-panel">
            <div class="panel-heading"><div><h3>XP earned</h3><p>Your learning momentum, day by day</p></div><span class="week-total">${progress.weekly.reduce((total, day) => total + day.xp, 0)} <small>XP</small></span></div>
            <div class="xp-chart" role="img" aria-label="Weekly XP activity chart">
              ${progress.weekly.map(day => `<div class="xp-day"><div class="xp-bar-track"><span class="xp-bar-fill" style="height:${Math.max(day.xp ? 8 : 2, (day.xp / max) * 100)}%"></span></div><strong>${day.xp || ''}</strong><span>${weekdayLabel(day.day)}</span></div>`).join('')}
            </div>
          </div>
        </section>

        <section class="dash-section">
          ${sectionHeading('Recent activity', '<a class="dashboard-text-link" href="#/progress">History ' + icon('chevronRight', 15) + '</a>')}
          <div class="dashboard-panel activity-panel">
            ${progress.recent.length ? progress.recent.slice(0, 4).map(item => `
              <div class="activity-row"><span class="activity-icon">${icon(item.detail === 'Completed lesson' ? 'check' : 'learn', 16)}</span>
                <span class="activity-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)} · ${timeAgo(item.time)}</small></span>
                <span class="activity-xp">${item.detail === 'Completed lesson' ? 'Completed' : 'In progress'}</span>
              </div>`).join('') : `<div class="dashboard-empty">Your lesson activity will show here as you learn.</div>`}
          </div>
        </section>
      </div>

      <aside class="dashboard-aside" aria-label="Your learning overview">
        <section class="dash-section">
          ${sectionHeading('Daily goal', `<a class="goal-settings" href="#/profile" aria-label="Edit daily goal" title="Edit daily goal">${icon('edit', 15)}</a>`)}
          <div class="dashboard-panel goal-panel">
            <div class="goal-summary"><div class="goal-ring" style="--goal-progress:${Math.round(activeDays / 7 * 100)}%"><div><strong>${activeDays}<span>/7</span></strong><small>active days</small></div></div><div class="goal-copy"><strong>${goalMinutes} min</strong><span>daily practice goal</span><small>${activeDays ? `${activeDays} active ${activeDays === 1 ? 'day' : 'days'} this week` : 'Start a learning streak this week'}</small></div></div>
            <div class="week-activity" aria-label="Weekly activity">
              ${weekDays.map((day, index) => `<div class="week-day ${day.active ? 'is-complete' : ''} ${day.protected ? 'is-protected' : ''} ${index === weekDays.length - 1 ? 'is-today' : ''}" aria-label="${day.day}${day.protected ? ', streak freeze used' : day.active ? ', active' : ', no activity'}${index === weekDays.length - 1 ? ', today' : ''}"><span>${weekdayLabel(day.day)}</span><i>${day.protected ? icon('admin', 12) : day.active ? icon('check', 12) : ''}</i></div>`).join('')}
            </div>
            <p class="streak-freeze-note">${streak.freezesAvailable ? `${streak.freezesAvailable} streak freeze available` : `Next streak freeze in ${streak.daysUntilNextFreeze ?? 7} active days`}</p>
          </div>
        </section>

        <section class="dash-section">
          ${sectionHeading('Weekly leaderboard', '<a class="dashboard-text-link" href="#/friends">View all ' + icon('chevronRight', 15) + '</a>')}
          <div class="dashboard-panel leaderboard-panel">
            ${leaderboard.rows.length ? leaderboard.rows.slice(0, 5).map(row => `
              <div class="leaderboard-row ${row.isMe ? 'is-you' : ''}"><span class="leaderboard-rank rank-${row.rank}">${row.rank}</span><span class="leaderboard-avatar">${row.avatar ? `<img class="avatar-photo" src="${escapeHtml(row.avatar)}" alt="">` : escapeHtml((row.name || '?').trim()[0]?.toUpperCase() || '?')}</span><span class="leaderboard-name"><strong>${escapeHtml(row.name)}${row.isMe ? ' <small>you</small>' : ''}</strong></span><span class="leaderboard-xp">${row.xp}<small>XP</small></span></div>`).join('') : `<div class="dashboard-empty leaderboard-empty">Practice this week to join the leaderboard.</div>`}
          </div>
        </section>

        <section class="dash-section">
          ${sectionHeading('Daily challenge', '')}
          <div class="dashboard-panel challenge-panel ${completedLessonToday ? 'is-complete' : ''}">
            <div class="challenge-heading"><span class="challenge-icon">${completedLessonToday ? icon('check', 20) : icon('sparkles', 20)}</span><span class="challenge-reward">${completedLessonToday ? 'Complete' : 'Today'}</span></div>
            <h3>${completedLessonToday ? 'Lesson complete' : 'Finish one lesson'}</h3>
            <p>${completedLessonToday ? 'You made time to learn today. Keep your momentum going.' : 'Complete a lesson today to build your streak and earn its XP reward.'}</p>
            <div class="challenge-progress-label"><span>${completedLessonToday ? 'Daily challenge complete' : 'One lesson · your next step'}</span>${completedLessonToday ? icon('check', 15) : icon('chevronRight', 15)}</div>
            <a class="challenge-link" href="${activeLesson ? `#/lessons/${activeLesson._id}` : '#/lessons'}">${completedLessonToday ? 'Choose another lesson' : 'Continue learning'} ${icon('chevronRight', 15)}</a>
          </div>
        </section>
      </aside>
    </div>
  `;

  mountDashboardSearch(lessons);
  mountDashboardNotifications(notifications);

  if (!streak.currentStreak && !state.remindedToday) {
    // no-op placeholder for future nudge; left minimal intentionally
  }
}

function lessonRow(l) {
  return `<a class="recommended-row" href="#/lessons/${l._id}">
    <span class="recommended-icon">${icon('learn', 16)}</span>
    <span class="recommended-copy"><strong>${escapeHtml(l.title)}</strong><small>${escapeHtml(l.language)} · ${escapeHtml(l.level || 'A1')}</small></span>
    ${icon('chevronRight', 17)}
  </a>`;
}
function sectionHeading(title, action) { return `<div class="dashboard-section-heading"><h2>${title}</h2>${action}</div>`; }
function skillCard(title, iconName, description, accent, href) {
  return `<a class="skill-card ${accent}" href="${href}"><span class="skill-icon">${icon(iconName, 18)}</span><span class="skill-copy"><strong>${title}</strong><small>${description}</small></span><span class="skill-arrow">${icon('chevronRight', 16)}</span></a>`;
}
function languageCard(language, lessons, photo) {
  const count = lessons.filter(lesson => lesson.language === language).length;
  const status = count ? `${count} ${count === 1 ? 'lesson' : 'lessons'}` : 'Coming soon';
  return `<a class="language-card" href="#/lessons" aria-label="Explore ${language}, ${status}">
    <span class="language-photo" style="--language-image:url('${escapeHtml(photo)}')"><span>${escapeHtml(languageCode(language))}</span></span>
    <span class="language-details"><strong>${language}</strong><small>${status}</small></span>
    <span class="language-arrow">${icon('chevronRight', 15)}</span>
  </a>`;
}
function languageCode(language) {
  return ({ Spanish: 'ES', French: 'FR', Japanese: 'JP', German: 'DE' })[language] || language.slice(0, 2).toUpperCase();
}
function mountDashboardSearch(lessons) {
  const input = document.getElementById('dashboardSearch');
  const results = document.getElementById('dashboardSearchResults');
  if (!input || !results) return;

  function renderResults() {
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) {
      results.hidden = true;
      results.innerHTML = '';
      return [];
    }
    const matches = lessons.filter(lesson => `${lesson.title} ${lesson.language} ${lesson.level}`.toLocaleLowerCase().includes(query)).slice(0, 5);
    results.innerHTML = matches.length ? matches.map(lesson => `<a role="option" href="#/lessons/${lesson._id}"><span class="search-result-icon">${icon('learn', 15)}</span><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.language)} · ${escapeHtml(lesson.level || 'A1')}</small></span>${icon('chevronRight', 15)}</a>`).join('') : `<div class="search-no-results">No lessons found</div>`;
    results.hidden = false;
    return matches;
  }

  input.addEventListener('input', renderResults);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      input.value = '';
      results.hidden = true;
    }
    if (event.key === 'Enter') {
      const firstResult = results.querySelector('a');
      if (firstResult) location.hash = firstResult.getAttribute('href');
    }
  });
  document.querySelector('.dashboard-topbar')?.addEventListener('pointerdown', event => {
    if (!event.target.closest('.dashboard-search-wrap')) results.hidden = true;
  });
}
function mountDashboardNotifications(notifications) {
  const toggle = document.getElementById('dashboardNotificationToggle');
  const panel = document.getElementById('dashboardNotificationPanel');
  const dot = document.getElementById('dashboardNotificationDot');
  if (!toggle || !panel || !dot) return;

  function render() {
    const unread = notifications.filter(notification => !notification.read).length;
    dot.hidden = !unread;
    panel.innerHTML = `<div class="notification-panel-heading"><span><strong>Notifications</strong><small>${unread ? `${unread} unread` : 'You’re all caught up'}</small></span><button type="button" data-read-all ${unread ? '' : 'disabled'}>Mark all read</button></div>
      <div class="notification-items">${notifications.length ? notifications.slice(0, 6).map(notification => `<button class="notification-item ${notification.read ? '' : 'is-unread'}" type="button" data-notification-id="${escapeHtml(notification._id)}"><span class="notification-item-dot"></span><span class="notification-item-copy"><strong>${escapeHtml(notification.title)}</strong><small>${escapeHtml(notification.body)}</small><em>${timeAgo(notification.createdAt)}</em></span></button>`).join('') : `<div class="notification-empty">No notifications yet.</div>`}</div>`;

    panel.querySelector('[data-read-all]').addEventListener('click', async () => {
      try {
        await put('/notifications/read-all');
        notifications.forEach(notification => { notification.read = true; });
        render();
      } catch (error) {
        showNotificationError(error.message);
      }
    });
    panel.querySelectorAll('[data-notification-id]').forEach(item => item.addEventListener('click', async () => {
      const notification = notifications.find(entry => entry._id === item.dataset.notificationId);
      if (!notification || notification.read) return;
      try {
        await put(`/notifications/${notification._id}/read`);
        notification.read = true;
        render();
      } catch (error) {
        showNotificationError(error.message);
      }
    }));
  }

  function showNotificationError(message) {
    panel.querySelector('.notification-error')?.remove();
    panel.insertAdjacentHTML('afterbegin', `<p class="notification-error">${escapeHtml(message)}</p>`);
  }

  render();
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.querySelector('.dashboard-topbar').addEventListener('pointerdown', event => {
    if (!event.target.closest('.dashboard-notifications') && !panel.hidden) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}
function firstName() { return (state.user?.name || 'there').split(' ')[0]; }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function dayLabel() { return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }
function weekdayLabel(iso) { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })[0]; }
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}
function dayKeyFor(iso, timezone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}
