import { get } from '../api.js';
import { renderShell } from '../shell.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { flagForLanguage } from './lessons.js';

const TABS = [
  ['overview', 'Overall Progress'],
  ['lessons', 'Lessons'],
  ['quizzes', 'Quizzes'],
  ['achievements', 'Achievements']
];
const ACHIEVEMENT_ICONS = { flame: 'flame', star: 'star', diamond: 'sparkles', book: 'learn', check: 'check', friends: 'friends' };

export async function renderProgress() {
  const view = renderShell('#/progress', 'Progress', 'Your learning journey');
  view.innerHTML = `<div class="card skeleton" style="height:320px"></div>`;

  const [progress, streak, lessons, badges] = await Promise.all([
    get('/progress'), get('/streaks'), get('/lessons'), get('/achievements/me').catch(() => [])
  ])
    .catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });

  let activeTab = 'overview';
  let subjectProgressExpanded = false;
  const overallPercent = Math.max(0, Math.min(100, Number(progress.overallPercent) || 0));
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked) return new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0);
    return (a.goal || 0) - (b.goal || 0) || a.title.localeCompare(b.title);
  });
  const unlockedBadges = sortedBadges.filter(badge => badge.unlocked);
  const maxWeeklyXp = Math.max(1, ...progress.weekly.map(day => day.xp));

  function draw() {
    view.innerHTML = `
      <div class="progress-layout">
        <section class="progress-hero">
          <div class="progress-hero-copy">
            <span class="progress-hero-eyebrow">Your progress</span>
            <h2>Small steps,<br>big dreams!</h2>
            <p>Keep learning, keep growing.<br>You're doing great!</p>
          </div>
        </section>

        <main class="progress-primary">
          <nav class="progress-tabs" role="tablist" aria-label="Progress views">
            ${TABS.map(([id, label]) => `<button class="progress-tab ${id === activeTab ? 'active' : ''}" type="button" role="tab" data-progress-tab="${id}" aria-selected="${id === activeTab}">${label}</button>`).join('')}
          </nav>
          <div class="progress-tab-panel" role="tabpanel">${tabContent()}</div>
        </main>

        <aside class="progress-rail" aria-label="Progress summary">
          <section class="progress-rail-card streak-summary">
            <div class="progress-rail-heading"><h3>${icon('flame', 20)} Learning Streak</h3></div>
            <div class="streak-summary-main">
              <div class="streak-fire-art">${icon('flame', 38)}</div>
              <div class="streak-current"><strong>${streak.currentStreak} ${streak.currentStreak === 1 ? 'Day' : 'Days'}</strong><span>${streak.currentStreak ? 'Keep it going!' : 'Start today!'}</span></div>
              <div class="streak-best"><span>${icon('flame', 14)} Longest Streak</span><strong>${streak.longestStreak} Days</strong></div>
            </div>
            <p class="streak-freeze-note">${streak.freezesAvailable ? `${streak.freezesAvailable} streak freeze available` : `Next streak freeze in ${streak.daysUntilNextFreeze ?? 7} active days`}</p>
            <div class="progress-week-strip" aria-label="Activity this week">${weekStrip(streak)}</div>
          </section>

          <section class="progress-rail-card">
            <div class="progress-rail-heading"><h3>Your Stats</h3><span class="progress-period">This Week</span></div>
            <div class="progress-stat-grid">
              ${railStat('learn', progress.lessonsCompleted, 'Lessons', 'stat-lessons')}
              ${railStat('practice', progress.quizAttempts, 'Quizzes', 'stat-quizzes')}
              ${railStat('star', state.user?.xp ?? 0, 'Total XP', 'stat-xp')}
              ${railStat('progress', `${progress.quizAccuracy || 0}%`, 'Accuracy', 'stat-accuracy')}
            </div>
          </section>

          <section class="progress-rail-card badges-summary">
            <div class="progress-rail-heading"><h3>Badges</h3><a href="#/achievements">See all ${icon('chevronRight', 13)}</a></div>
            <div class="badge-preview-grid">
              ${sortedBadges.slice(0, 4).map(badge => `<a class="badge-preview ${badge.unlocked ? '' : 'locked'}" href="#/achievements" title="${escapeHtml(badge.title)}"><span>${icon(ACHIEVEMENT_ICONS[badge.icon] || 'star', 20)}</span><small>${escapeHtml(badge.title)}</small></a>`).join('') || `<p class="progress-muted">Keep learning to unlock your first badge.</p>`}
            </div>
          </section>

          <section class="progress-achievement-promo">
            <img src="/assets/mascot-idea.png" alt="" loading="lazy">
            <div><strong>You're doing amazing!</strong><p>Keep going and unlock more achievements.</p><a href="#/achievements">View achievements ${icon('chevronRight', 13)}</a></div>
          </section>

          <section class="progress-quick-actions">
            <h3>Quick Actions</h3>
            <div><a class="btn" href="#/lessons">${icon('play', 14)} Continue Learning</a><a class="btn secondary" href="#/quizzes">${icon('practice', 14)} Take a Quiz</a></div>
          </section>
        </aside>
      </div>
    `;

    view.querySelectorAll('[data-progress-tab]').forEach(button => button.addEventListener('click', () => {
      activeTab = button.dataset.progressTab;
      draw();
    }));

    updateSubjectGrid();
    view.querySelectorAll('[data-subject-progress-toggle]').forEach(button => button.addEventListener('click', () => {
      subjectProgressExpanded = !subjectProgressExpanded;
      draw();
    }));
  }

  function updateSubjectGrid() {
    view.querySelectorAll('.progress-subject-grid').forEach(grid => {
      const columns = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length;
      const visibleCount = columns * 3;
      const cards = [...grid.querySelectorAll('.progress-subject-card')];
      cards.forEach((card, index) => {
        card.hidden = !subjectProgressExpanded && index >= visibleCount;
      });

      const toggle = grid.previousElementSibling?.querySelector('[data-subject-progress-toggle]');
      if (toggle) {
        toggle.style.display = cards.length > visibleCount ? '' : 'none';
        toggle.innerHTML = `${subjectProgressExpanded ? 'See less' : 'See all'} ${icon('chevronRight', 13)}`;
        toggle.setAttribute('aria-expanded', String(subjectProgressExpanded));
      }
    });
  }

  function tabContent() {
    if (activeTab === 'lessons') return `
      ${sectionTitle('Subject-wise Progress', '<button class="progress-subject-toggle" type="button" data-subject-progress-toggle aria-expanded="false">See all ' + icon('chevronRight', 13) + '</button>')}
      <div class="progress-subject-grid">${subjectCards(lessons)}</div>
      ${sectionTitle('Your Lessons', `${progress.lessonsCompleted} of ${progress.lessonsTotal} complete`)}
      <div class="progress-panel progress-lesson-list">${lessons.length ? lessons.map(lesson => `<a class="progress-lesson-row" href="#/lessons/${lesson._id}"><span class="progress-subject-flag">${flagForLanguage(lesson.language)}</span><span class="progress-lesson-copy"><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.language)} · ${escapeHtml(lesson.level || 'A1')}</small></span><span class="progress-lesson-state ${lesson.completed ? 'complete' : ''}">${lesson.completed ? icon('check', 14) + ' Done' : 'Continue'}</span></a>`).join('') : `<div class="progress-empty">No lessons are available yet.</div>`}</div>
    `;
    if (activeTab === 'quizzes') return `
      ${sectionTitle('Quiz Progress', 'Practice builds accuracy')}
      <div class="progress-quiz-summary"><div class="progress-quiz-score"><strong>${progress.quizAccuracy || 0}%</strong><span>Average accuracy</span></div><div class="progress-quiz-details"><div><strong>${progress.quizAttempts}</strong><span>Quizzes taken</span></div><div><strong>${progress.quizzesPassed || 0}</strong><span>Passed</span></div></div></div>
      ${sectionTitle('XP This Week', 'Your practice day by day')}
      <div class="progress-panel progress-weekly-chart">${weeklyChart()}</div>
      <a class="progress-inline-cta" href="#/quizzes">Choose a quiz to keep practicing ${icon('chevronRight', 15)}</a>
    `;
    if (activeTab === 'achievements') return `
      ${sectionTitle('Your Achievements', `${unlockedBadges.length} of ${badges.length} unlocked`)}
      <div class="progress-achievement-grid">${sortedBadges.map(badge => `<div class="progress-achievement-card ${badge.unlocked ? 'unlocked' : 'locked'}"><span>${icon(ACHIEVEMENT_ICONS[badge.icon] || 'star', 23)}</span><strong>${escapeHtml(badge.title)}</strong><small>${escapeHtml(badge.description)}</small>${badge.unlocked ? '<em>Unlocked</em>' : '<em>Keep going</em>'}</div>`).join('') || `<div class="progress-empty">Achievements will appear here as you learn.</div>`}</div>
    `;

    const nextMilestone = overallPercent >= 100 ? 100 : Math.min(100, (Math.floor(overallPercent / 10) + 1) * 10);
    const lessonsToMilestone = Math.max(0, Math.ceil(progress.lessonsTotal * nextMilestone / 100) - progress.lessonsCompleted);
    const nudge = lessonsToMilestone ? `Complete ${lessonsToMilestone} more ${lessonsToMilestone === 1 ? 'lesson' : 'lessons'} to reach ${nextMilestone}%.` : 'You have completed the full curriculum!';
    return `
      <section class="progress-overview-panel">
        <div class="progress-main-ring" style="--progress-value:${overallPercent}%"><div><strong>${overallPercent}%</strong><small>Overall Progress</small></div></div>
        <div class="progress-overview-details">
          <div class="progress-overview-stats">
            ${overviewStat('learn', progress.lessonsCompleted, 'Lessons Completed', 'overview-lessons')}
            ${overviewStat('practice', progress.quizAttempts, 'Quizzes Taken', 'overview-quizzes')}
            ${overviewStat('star', unlockedBadges.length, 'Badges Earned', 'overview-badges')}
          </div>
          <div class="progress-milestone">${icon('sparkles', 18)}<span><strong>You're on a roll!</strong><small>${nudge}</small></span>${icon('chevronRight', 15)}</div>
        </div>
      </section>
      ${sectionTitle('Subject-wise Progress', '<button class="progress-subject-toggle" type="button" data-subject-progress-toggle aria-expanded="false">See all ' + icon('chevronRight', 13) + '</button>')}
      <div class="progress-subject-grid">${subjectCards(lessons)}</div>
      ${sectionTitle('Recent Activity', '<a href="#/progress" data-show-activity>See all ' + icon('chevronRight', 13) + '</a>')}
      <div class="progress-panel progress-activity-list">${activityRows(progress.recent)}</div>
    `;
  }

  function weeklyChart() {
    return `<div class="progress-chart">${progress.weekly.map(day => `<div class="progress-chart-day"><strong>${day.xp || ''}</strong><span class="progress-chart-track"><i style="height:${Math.max(day.xp ? 8 : 3, day.xp / maxWeeklyXp * 100)}%"></i></span><small>${weekday(day.day)}</small></div>`).join('')}</div>`;
  }

  function handleSubjectGridResize() {
    if (!view.isConnected) {
      window.removeEventListener('resize', handleSubjectGridResize);
      return;
    }
    updateSubjectGrid();
  }

  window.addEventListener('resize', handleSubjectGridResize);
  draw();
}
function sectionTitle(title, action) { return `<div class="progress-section-heading"><h3>${title}</h3>${action || ''}</div>`; }
function overviewStat(iconName, value, label, accent) { return `<div class="progress-overview-stat"><span class="progress-stat-icon ${accent}">${icon(iconName, 17)}</span><span><strong>${value}</strong><small>${label}</small></span></div>`; }
function railStat(iconName, value, label, accent) { return `<div class="progress-rail-stat"><span class="progress-rail-stat-icon ${accent}">${icon(iconName, 17)}</span><span><strong>${value}</strong><small>${label}</small></span></div>`; }
function subjectCards(lessons) {
  const byLanguage = new Map();
  for (const lesson of lessons) {
    const subject = byLanguage.get(lesson.language) || { total: 0, completed: 0 };
    subject.total++;
    if (lesson.completed) subject.completed++;
    byLanguage.set(lesson.language, subject);
  }
  return [...byLanguage.entries()].map(([language, subject]) => ({
    language,
    ...subject,
    percent: subject.total ? Math.round(subject.completed / subject.total * 100) : 0
  })).sort((a, b) => b.percent - a.percent || b.completed - a.completed || a.language.localeCompare(b.language))
    .map(subject => `<a class="progress-subject-card" href="#/lessons"><span class="progress-subject-top"><span class="progress-subject-flag">${flagForLanguage(subject.language)}</span><strong>${escapeHtml(subject.language)}</strong>${icon('chevronRight', 13)}</span><span class="progress-subject-count">${subject.completed}/${subject.total} lessons</span><span class="progress-subject-track"><i style="width:${subject.percent}%"></i></span><span class="progress-subject-percent">${subject.percent}%</span></a>`).join('') || `<div class="progress-empty">Your language progress will appear here.</div>`;
}
function activityRows(recent) {
  if (!recent.length) return `<div class="progress-empty">Complete a lesson to see your activity here.</div>`;
  return recent.slice(0, 5).map(item => `<div class="progress-activity-row"><span class="progress-activity-icon ${item.detail === 'Completed lesson' ? 'activity-complete' : ''}">${icon(item.detail === 'Completed lesson' ? 'check' : 'progress', 15)}</span><span class="progress-activity-copy"><strong>${escapeHtml(item.detail)} · ${escapeHtml(item.title)}</strong><small>${timeAgo(item.time)}</small></span><span class="progress-activity-kind">${item.detail === 'Completed lesson' ? 'Lesson' : 'In progress'}</span></div>`).join('');
}
function weekStrip(streak) {
  const days = (streak.calendar || []).slice(-7);
  return days.map((day, index) => `<div class="progress-week-day ${day.active ? 'active' : ''} ${day.protected ? 'protected' : ''} ${index === days.length - 1 ? 'today' : ''}" aria-label="${day.day}, ${day.protected ? 'streak freeze used' : day.active ? 'active' : 'no activity'}"><span class="progress-week-dot">${day.protected ? icon('admin', 11) : day.active ? icon('check', 11) : ''}</span><small>${weekday(day.day)}</small></div>`).join('');
}
function weekday(iso) { return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3); }
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
