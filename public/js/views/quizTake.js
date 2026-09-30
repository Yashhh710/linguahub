import { get, post } from '../api.js';
import { renderShell } from '../shell.js';
import { showSkeleton } from '../skeleton.js';
import { icon } from '../icons.js';
import { announceGains } from '../toast.js';

export async function renderQuizTake(id) {
  const isAdhoc = id === 'adhoc';
  const view = renderShell('#/quizzes', isAdhoc ? 'AI-generated quiz' : 'Quiz', 'Answer every question, then submit');
  showSkeleton(view, 'quizTake');

  let quiz;
  if (isAdhoc) {
    try { quiz = JSON.parse(sessionStorage.getItem('lh_adhoc_quiz') || 'null'); }
    catch { quiz = null; }
    if (!quiz) { view.innerHTML = `<div class="empty">That generated quiz has expired. <a class="link" href="#/quizzes">Generate a new one</a>.</div>`; return; }
  } else {
    quiz = await get(`/quizzes/${id}`).catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });
  }

  const startedAt = Date.now();
  const answers = new Array(quiz.questions.length).fill(null);
  let submitted = false;
  let result = null;

  function draw() {
    if (submitted) return drawResult();
    view.innerHTML = `
      <a class="link" href="#/quizzes">&larr; Back to practice</a>
      <h2 style="font-size:24px;margin-top:12px">${escapeHtml(quiz.title)}</h2>
      <p class="muted" style="margin-top:6px">${quiz.language} · ${quiz.level || ''} · ${quiz.questions.length} questions${isAdhoc ? ' · practice only, not saved' : ''}</p>
      <div style="margin-top:20px;display:flex;flex-direction:column;gap:16px">
        ${quiz.questions.map((q, i) => `
          <div class="card">
            <b>${i + 1}. ${escapeHtml(q.question)}</b>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
              ${q.options.map((opt, j) => `
                <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;cursor:pointer" class="opt-label" data-q="${i}">
                  <input type="radio" name="q${i}" value="${j}" ${answers[i] === j ? 'checked' : ''}>
                  <span>${escapeHtml(opt)}</span>
                </label>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <button class="btn full" id="submitBtn" style="margin-top:18px" ${answers.includes(null) ? 'disabled' : ''}>Submit answers</button>
    `;
    view.querySelectorAll('input[type=radio]').forEach(input => input.addEventListener('change', () => {
      answers[Number(input.name.slice(1))] = Number(input.value);
      view.querySelector('#submitBtn').disabled = answers.includes(null);
    }));
    view.querySelector('#submitBtn').addEventListener('click', submit);
  }

  async function submit() {
    const btn = view.querySelector('#submitBtn');
    btn.disabled = true; btn.textContent = 'Grading...';
    const timeSpentSec = Math.round((Date.now() - startedAt) / 1000);

    if (isAdhoc) {
      const score = quiz.questions.reduce((t, q, i) => t + (answers[i] === q.correctAnswer ? 1 : 0), 0);
      const percent = Math.round((score / quiz.questions.length) * 100);
      result = { percent, score, total: quiz.questions.length, passed: percent >= 70, review: quiz.questions.map((q, i) => ({ ...q, yourAnswer: answers[i] })) };
      sessionStorage.removeItem('lh_adhoc_quiz');
    } else {
      const { attempt, gains } = await post(`/quizzes/${id}/attempts`, { answers, timeSpentSec });
      result = attempt;
      announceGains(gains);
    }
    submitted = true;
    draw();
  }

  function drawResult() {
    view.innerHTML = `
      <div class="card" style="text-align:center;padding:36px 20px">
        <div style="font-size:44px;font-weight:800;color:${result.passed !== false && result.percent >= 70 ? 'var(--mint)' : 'var(--coral)'}">${result.percent}%</div>
        <p class="muted" style="margin-top:6px">${result.score} of ${result.total} correct</p>
        ${!isAdhoc ? `<p style="margin-top:10px;font-weight:700;color:var(--blue)">+${result.xpEarned} XP</p>` : ''}
        <div style="display:flex;gap:10px;justify-content:center;margin-top:18px">
          <a class="btn quiz-result-back" href="#/quizzes">${icon('chevronRight', 16)} Back to practice</a>
        </div>
      </div>
      <div class="section-head"><h2>Review</h2></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${result.review.map((q, i) => `
          <div class="card">
            <b>${i + 1}. ${escapeHtml(q.question)}</b>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
              ${q.options.map((opt, j) => `
                <div style="padding:9px 12px;border-radius:9px;font-size:13.5px;${optStyle(q, j)}">${escapeHtml(opt)}${j === q.correctAnswer ? ' ✓' : (j === q.yourAnswer ? ' ✗' : '')}</div>
              `).join('')}
            </div>
            ${q.explanation ? `<p class="muted" style="margin-top:10px">${escapeHtml(q.explanation)}</p>` : ''}
          </div>`).join('')}
      </div>
    `;
  }

  draw();
}

function optStyle(q, j) {
  if (j === q.correctAnswer) return 'background:var(--mint-dim);color:var(--mint);font-weight:700';
  if (j === q.yourAnswer) return 'background:var(--coral-dim);color:var(--coral);font-weight:700';
  return 'background:var(--surface-2);color:var(--ink-soft)';
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
