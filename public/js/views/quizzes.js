import { get, post } from '../api.js';
import { renderShell } from '../shell.js';
import { icon } from '../icons.js';
import { state } from '../state.js';
import { LANGUAGE_CATALOG, flagForLanguage } from './lessons.js';

const CATEGORY_MAP = [
  ['Language Basics', ['greeting', 'basics', 'number', 'introduction']],
  ['Vocabulary', ['vocab', 'food', 'travel', 'shopping']],
  ['Grammar', ['grammar', 'past', 'tense', 'plan']],
  ['Listening', ['listen']],
  ['Speaking', ['speak', 'pronun']]
];
function categoryFor(topic = '') {
  const topicLower = topic.toLowerCase();
  for (const [label, keywords] of CATEGORY_MAP) if (keywords.some(keyword => topicLower.includes(keyword))) return label;
  return null;
}

export async function renderQuizzes() {
  const view = renderShell('#/quizzes', 'Practice', '');
  injectSearchBar(view);
  view.innerHTML = `<div class="card skeleton" style="height:220px;margin-bottom:20px"></div><div class="grid grid-3">${Array(6).fill('<div class="card skeleton" style="height:170px"></div>').join('')}</div>`;

  const [quizzes, attempts, progress, streak, leaderboard] = await Promise.all([
    get('/quizzes'), get('/quizzes/attempts/me'), get('/progress'), get('/streaks'), get('/leaderboard?scope=global&period=week')
  ]).catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });

  const bestByQuiz = new Map();
  for (const attempt of attempts) {
    const previous = bestByQuiz.get(String(attempt.quiz));
    if (!previous || attempt.percent > previous.percent) bestByQuiz.set(String(attempt.quiz), attempt);
  }

  const randomizedQuizzes = shuffle(quizzes);
  const languages = [...new Set(quizzes.map(quiz => quiz.language))].sort();
  const generatorLanguages = ['Spanish', ...new Set([...LANGUAGE_CATALOG, ...languages].filter(language => language !== 'Spanish'))].sort((a, b) => a === 'Spanish' ? -1 : b === 'Spanish' ? 1 : a.localeCompare(b));
  const categories = ['All Categories', ...new Set(quizzes.map(quiz => categoryFor(quiz.topic)).filter(Boolean))];
  let activeCategory = 'All Categories';
  let activeLanguage = 'All Languages';
  let sortBy = 'random';
  let searchTerm = '';
  function applyFilters() {
    let list = [...(sortBy === 'random' ? randomizedQuizzes : quizzes)];
    if (activeCategory !== 'All Categories') list = list.filter(quiz => categoryFor(quiz.topic) === activeCategory);
    if (activeLanguage !== 'All Languages') list = list.filter(quiz => quiz.language === activeLanguage);
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      list = list.filter(quiz => quiz.title.toLowerCase().includes(query)
        || quiz.language.toLowerCase().includes(query)
        || (quiz.topic || '').toLowerCase().includes(query));
    }
    if (sortBy === 'xp') list.sort((a, b) => b.xpReward - a.xpReward);
    else if (sortBy === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  function draw() {
    const list = applyFilters();
    const daysActiveThisWeek = progress.weekly.filter(day => day.xp > 0).length;
    const dailyQuiz = pickDailyQuiz(quizzes);

    view.innerHTML = `
      <div class="quiz-workspace">
        <div class="daily-banner">
          <div>
            <div class="kicker">${icon('practice', 15)} Quiz Arena · Daily Challenge</div>
            <h2>Daily Challenge</h2>
            <p class="sub">Keep your streak alive — one quiz a day builds real fluency.</p>
            <div class="chips">
              <span class="chip">${icon('flame', 14)} ${streak.currentStreak} day streak</span>
              ${dailyQuiz ? `<span class="chip">${icon('star', 14)} +${dailyQuiz.xpReward} XP reward</span>` : ''}
              <span class="chip">${daysActiveThisWeek} / 7 days this week</span>
            </div>
            <div class="progress-track" style="margin-top:14px">
              <div class="progress-fill" style="width:${Math.round((daysActiveThisWeek / 7) * 100)}%"></div>
            </div>
          </div>
          <div class="quiz-arena-actions">
            ${dailyQuiz ? `<a class="btn" href="#/quizzes/${dailyQuiz._id}">Start Daily Quiz ${icon('chevronRight', 16)}</a>` : ''}
            <a class="btn secondary quizblast-button" href="https://quiz-blast-co.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="Open QuizBlast in a new tab">${icon('play', 14)} QuizBlast</a>
          </div>
        </div>

        <aside class="quiz-sidebar">
          <div class="side-card">
            <div class="side-head"><h4>Your Progress</h4><a class="link" href="#/progress">View all ${icon('chevronRight', 12)}</a></div>
            ${levelRingHtml()}
          </div>

          <div class="side-card">
            <div class="side-head"><h4>${icon('flame', 15)} ${streak.currentStreak} Day Streak</h4></div>
            <p class="muted" style="font-size:12.5px">${streak.currentStreak ? 'Keep it going!' : 'Complete a quiz today to start one.'}</p>
            <p class="streak-freeze-note">${streak.freezesAvailable ? `${streak.freezesAvailable} streak freeze available` : `Next streak freeze in ${streak.daysUntilNextFreeze ?? 7} active days`}</p>
            ${weekStripHtml(streak)}
          </div>

          <div class="side-card">
            <div class="side-head"><h4>Top Learners</h4><a class="link" href="#/friends">View all ${icon('chevronRight', 12)}</a></div>
            ${leaderboardHtml(leaderboard.rows)}
          </div>

          <div class="ai-cta">
            <span class="ai-cta-icon">${icon('sparkles', 18)}</span>
            <div class="ai-cta-copy"><b>Create AI Quiz</b><p>Generate a quiz on any topic or language.</p></div>
            <button class="go" id="sideGenBtn" type="button" aria-label="Create an AI quiz">${icon('chevronRight', 17)}</button>
          </div>
        </aside>

        <div class="cat-bar">
          ${categories.map(category => `<button class="cat-pill ${category === activeCategory ? 'active' : ''}" data-cat="${escapeAttr(category)}">${category === 'All Categories' ? icon('learn', 14) : ''} ${category}</button>`).join('')}
          <select class="cat-select" id="langSelect">
            <option ${activeLanguage === 'All Languages' ? 'selected' : ''}>All Languages</option>
            ${languages.map(language => `<option ${language === activeLanguage ? 'selected' : ''}>${escapeHtml(language)}</option>`).join('')}
          </select>
          <select class="cat-select" id="sortSelect">
            <option value="random" ${sortBy === 'random' ? 'selected' : ''}>Random order</option>
            <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Newest first</option>
            <option value="xp" ${sortBy === 'xp' ? 'selected' : ''}>Highest XP</option>
            <option value="az" ${sortBy === 'az' ? 'selected' : ''}>A–Z</option>
          </select>
        </div>

        <div class="grid grid-4 quiz-grid" id="quizGrid">
          ${list.length ? list.map(quiz => quizCardHtml(quiz, bestByQuiz.get(String(quiz._id)))).join('') : `<div class="empty" style="grid-column:1/-1">No quizzes match those filters.</div>`}
        </div>
      </div>
    `;

    view.querySelectorAll('.cat-pill').forEach(button => button.addEventListener('click', () => { activeCategory = button.dataset.cat; draw(); }));
    view.querySelector('#langSelect').addEventListener('change', event => { activeLanguage = event.target.value; draw(); });
    view.querySelector('#sortSelect').addEventListener('change', event => { sortBy = event.target.value; draw(); });
    view.querySelector('#sideGenBtn').addEventListener('click', () => openGenerateModal(generatorLanguages));
  }

  draw();
  document.getElementById('arenaSearchInput')?.addEventListener('input', event => {
    searchTerm = event.target.value.trim();
    draw();
  });
}

function injectSearchBar() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const left = topbar.firstElementChild;
  left.outerHTML = `<div class="arena-search">${icon('search', 17)}<input id="arenaSearchInput" placeholder="Search quizzes, languages or topics..." aria-label="Search quizzes, languages or topics"></div>`;
}

function levelFromXp(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1; }
function xpForLevel(level) { return 100 * (level - 1) ** 2; }

function levelRingHtml() {
  const xp = state.user?.xp ?? 0;
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = xp - floor;
  const xpForNextLevel = next - floor;
  const percent = Math.max(4, Math.min(100, Math.round((xpIntoLevel / Math.max(1, xpForNextLevel)) * 100)));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const tier = level >= 10 ? 'Advanced' : level >= 5 ? 'Intermediate' : 'Beginner';
  return `
    <div class="level-ring-wrap">
      <div class="level-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="${radius}" fill="none" stroke="#E4EAF3" stroke-width="6"/>
          <circle cx="32" cy="32" r="${radius}" fill="none" stroke="var(--blue)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (percent / 100) * circumference}"/>
        </svg>
        <div class="center">Lv ${level}</div>
      </div>
      <div class="level-ring-summary">
        <b class="level-tier">${tier}</b>
        <div class="level-xp-label">${xpIntoLevel} / ${xpForNextLevel} XP</div>
        <div class="level-xp-track" role="progressbar" aria-label="XP to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
      </div>
    </div>`;
}

function weekStripHtml(streak) {
  const lastSeven = (streak.calendar || []).slice(-7);
  return `<div class="week-strip">${lastSeven.map(day => {
    const label = new Date(day.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
    return `<div class="day" aria-label="${day.day}, ${day.protected ? 'streak freeze used' : day.active ? 'active' : 'no activity'}"><div class="dot ${day.active ? 'active' : ''} ${day.protected ? 'protected' : ''}">${day.protected ? icon('admin', 12) : day.active ? icon('check', 12) : ''}</div>${label}</div>`;
  }).join('')}</div>`;
}

function leaderboardHtml(rows) {
  if (!rows.length) return `<p class="muted" style="font-size:12.5px">No XP logged this week yet — be the first!</p>`;
  const top = rows.slice(0, 3);
  const me = rows.find(row => row.isMe);
  return `
    ${top.map(row => `
      <div class="rank-row rank-${row.rank} ${row.isMe ? 'me' : ''}">
        <div class="rank-num">${row.rank}</div>
        <div class="rank-avatar">${row.avatar ? `<img class="avatar-photo" src="${escapeHtml(row.avatar)}" alt="">` : escapeHtml((row.name[0] || '?').toUpperCase())}</div>
        <div class="grow" style="flex:1"><div class="rank-name">${escapeHtml(row.name)}${row.isMe ? ' (you)' : ''}</div></div>
        <div class="rank-xp">${icon('flame', 11)} ${row.xp} XP</div>
      </div>`).join('')}
    ${me && me.rank > 3 ? `<div class="rank-ellipsis" aria-hidden="true">···</div><div class="rank-row rank-${me.rank} me"><div class="rank-num">${me.rank}</div><div class="rank-avatar">${me.avatar ? `<img class="avatar-photo" src="${escapeHtml(me.avatar)}" alt="">` : escapeHtml((me.name || '?')[0].toUpperCase())}</div><div class="grow" style="flex:1"><div class="rank-name">You</div></div><div class="rank-xp">${icon('flame', 11)} ${me.xp} XP</div></div>` : ''}
  `;
}

function quizCardHtml(quiz, best, isFeatured = false) {
  const completed = best?.passed;
  const progressPercent = best ? Math.round((best.score / best.total) * 100) : 0;
  return `<a class="quiz-card ${isFeatured ? 'featured' : ''}" href="#/quizzes/${quiz._id}">
    <div class="top-row"><span class="quiz-card-flag">${flagForLanguage(quiz.language)}</span><span class="level-pill">${escapeHtml(quiz.level || '')}</span></div>
    <h3>${escapeHtml(quiz.title)}</h3>
    <div class="desc">${escapeHtml(quiz.topic ? `Practice ${quiz.topic.toLowerCase()} with real feedback.` : '')}</div>
    <div class="lang-row">${escapeHtml(quiz.language)}</div>
    <div class="meta-row"><span>${icon('learn', 13)} ${quiz.questions?.length ?? '—'} questions</span><span>${icon('star', 13)} +${quiz.xpReward} XP</span><span class="go-btn">${icon('chevronRight', 16)}</span></div>
    ${completed ? `<div class="done-pill">${icon('check', 13)} Completed · ${best.percent}%</div>` : best ? `<div class="card-progress"><div class="progress-track"><div class="progress-fill" style="width:${progressPercent}%"></div></div></div>` : ''}
  </a>`;
}

function pickDailyQuiz(quizzes) {
  if (!quizzes.length) return null;
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
  return quizzes[dayOfYear % quizzes.length];
}

function shuffle(items) {
  const shuffled = [...items];
  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex--) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  return shuffled;
}

function openGenerateModal(languages) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>Generate a quiz</h3>
      <p class="muted" style="margin-top:6px">Pick a language, level, and topic — AI writes the questions.</p>
      <form id="genForm" style="margin-top:16px">
        <div class="field"><label>Language</label><select name="language">${languages.map(language => `<option value="${escapeAttr(language)}">${escapeHtml(language)}</option>`).join('')}</select></div>
        <div class="field"><label>Level</label><select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></div>
        <div class="field"><label>Topic</label><input name="topic" placeholder="e.g. Ordering coffee" required></div>
        <div class="field"><label>Number of questions</label><input name="count" type="number" min="3" max="20" value="8"></div>
        <div class="error-banner" id="genErr"></div>
        <div style="display:flex;gap:10px;margin-top:6px"><button type="button" class="btn secondary" id="cancelGen">Cancel</button><button type="submit" class="btn full">Generate</button></div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#cancelGen').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#genForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.target.querySelector('button[type=submit]');
    const errorBox = backdrop.querySelector('#genErr');
    button.disabled = true;
    button.textContent = 'Generating...';
    try {
      const data = new FormData(event.target);
      const quiz = await post('/quizzes/generate', {
        language: data.get('language'), level: data.get('level'), topic: data.get('topic'), count: Number(data.get('count'))
      });
      sessionStorage.setItem('lh_adhoc_quiz', JSON.stringify(quiz));
      location.hash = '#/quizzes/adhoc';
      backdrop.remove();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.add('show');
      button.disabled = false;
      button.textContent = 'Generate';
    }
  });
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character])); }
function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
