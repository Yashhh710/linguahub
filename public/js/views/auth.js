import { post, setSession } from '../api.js';
import { setUser } from '../state.js';

const loginInput = (type, placeholder, name, value = '') => `
  <div class="field-wrap">
    <span class="field-icon">${type === 'email' ? '✉' : '🔒'}</span>
    <input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${value}" ${type === 'password' ? 'autocomplete="current-password"' : 'autocomplete="email"'}>
    ${type === 'password' ? '<button class="field-visibility" type="button" aria-label="Show password">◉</button>' : ''}
  </div>
`;

function shellMarkup(mode = 'login') {
  const isRegister = mode === 'register';
  return `
    <div class="auth-shell">
      <main class="auth-main">
        <section class="auth-hero" aria-label="LinguaHub introduction">
          <div class="hero-pill">✦ Learn · Practice · Grow</div>
          <h1>${isRegister ? 'Create your account' : 'Welcome back to'}<span>LinguaHub</span></h1>
          <p>${isRegister ? 'Learn with guided lessons, quizzes, and an upbeat streak that keeps you moving.' : 'Continue your language journey and unlock new opportunities around the world.'}</p>
        </section>

        <section class="auth-form-side" aria-label="Authentication form">
          <div class="auth-card">
            <div class="card-brand">
              <span class="card-brand-mark">L</span>
              <span class="card-brand-name">LinguaHub</span>
            </div>
            <p class="card-text">${isRegister ? 'Create your account to begin your learning journey' : 'Sign in to continue your learning journey'}</p>
            <div class="error-banner" id="err"></div>

            <form id="${isRegister ? 'registerForm' : 'loginForm'}">
              ${isRegister ? '<div class="field-wrap"><span class="field-icon">✎</span><input id="name" name="name" type="text" placeholder="Full name" autocomplete="name"></div>' : ''}
              ${loginInput('email', 'Email address', 'email')}
              ${loginInput('password', 'Password', 'password')}

              ${isRegister ? `
                <div class="field-wrap select-wrap">
                  <span class="field-icon">⌂</span>
                  <select id="learningLanguage" name="learningLanguage">
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Japanese</option>
                    <option>English</option>
                    <option>German</option>
                    <option>Italian</option>
                    <option>Portuguese</option>
                    <option>Korean</option>
                  </select>
                </div>
              ` : `
                <div class="remember-row">
                  <label><input type="checkbox" checked> <span>Remember me</span></label>
                  <a href="#/login">Forgot password?</a>
                </div>
              `}

              <button class="submit-btn" type="submit">${isRegister ? 'Create account' : 'Sign In'}</button>

              ${!isRegister ? '<div class="divider"><span>OR</span></div>' : ''}

              <p class="auth-switch">
                ${isRegister ? 'Already have an account?' : "Don't have an account?"}
                <a href="#/${isRegister ? 'login' : 'register'}">${isRegister ? 'Log in' : 'Sign up'}</a>
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  `;
}

export function renderLogin() {
  document.getElementById('app').innerHTML = shellMarkup('login');

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('err');
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      const { token, user } = await post('/auth/login', {
        email: e.target.email.value.trim(),
        password: e.target.password.value,
      });
      setSession(token, user);
      setUser(user);
      location.hash = '#/dashboard';
    } catch (error) {
      err.textContent = error.message;
      err.classList.add('show');
    } finally {
      btn.disabled = false;
    }
  });

  const eye = document.querySelector('.field-visibility');
  if (eye) {
    eye.addEventListener('click', () => {
      const input = document.getElementById('password');
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.textContent = show ? '◌' : '◉';
    });
  }
}

export function renderRegister() {
  document.getElementById('app').innerHTML = shellMarkup('register');

  const form = document.getElementById('registerForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('err');
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { token, user } = await post('/auth/register', {
        name: e.target.name.value.trim(),
        email: e.target.email.value.trim(),
        password: e.target.password.value,
        learningLanguage: e.target.learningLanguage.value,
        timezone,
      });
      setSession(token, user);
      setUser(user);
      location.hash = '#/dashboard';
    } catch (error) {
      err.textContent = error.message;
      err.classList.add('show');
    } finally {
      btn.disabled = false;
    }
  });

  const eye = document.querySelector('.field-visibility');
  if (eye) {
    eye.addEventListener('click', () => {
      const input = document.getElementById('password');
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.textContent = show ? '◌' : '◉';
    });
  }
}

