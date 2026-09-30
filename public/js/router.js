import { getToken } from './api.js';
import { renderLogin, renderRegister } from './views/auth.js';
import { renderDashboard } from './views/dashboard.js';
import { renderLessons } from './views/lessons.js';
import { renderLessonDetail } from './views/lessonDetail.js';
import { renderQuizzes } from './views/quizzes.js';
import { renderQuizTake } from './views/quizTake.js';
import { renderProgress } from './views/progress.js';
import { renderFriends } from './views/friends.js';
import { renderAchievements } from './views/achievements.js';
import { renderProfile } from './views/profile.js';
import { renderStudio } from './views/studio.js';
import { renderAdmin } from './views/admin.js';

const PUBLIC_ROUTES = new Set(['#/login', '#/register']);

export async function route() {
  window.dispatchEvent(new Event('linguahub:route-changing'));
  let hash = location.hash || '#/dashboard';
  const authed = Boolean(getToken());

  if (!authed && !PUBLIC_ROUTES.has(hash.split('/').slice(0, 2).join('/'))) { location.hash = '#/login'; return; }
  if (authed && PUBLIC_ROUTES.has(hash)) { location.hash = '#/dashboard'; return; }

  const [, section, param] = hash.split('/');
  try {
    if (hash === '#/login') return renderLogin();
    if (hash === '#/register') return renderRegister();
    if (section === 'dashboard' || hash === '#/') return renderDashboard();
    if (section === 'lessons') return param ? renderLessonDetail(param) : renderLessons();
    if (section === 'quizzes') return param ? renderQuizTake(param) : renderQuizzes();
    if (section === 'progress') return renderProgress();
    if (section === 'friends') return renderFriends();
    if (section === 'achievements') return renderAchievements();
    if (section === 'profile') return renderProfile();
    if (section === 'studio') return renderStudio();
    if (section === 'admin') return renderAdmin();
    location.hash = '#/dashboard';
  } catch (error) {
    console.error(error);
  }
}
