import { get, post } from '../api.js';
import { renderShell } from '../shell.js';
import { icon } from '../icons.js';
import { showToast } from '../toast.js';

export async function renderStudio() {
  const view = renderShell('#/studio', 'Studio', 'Create lessons and quizzes for your students');
  let tab = 'lesson';

  function draw() {
    view.innerHTML = `
      <div class="tabs">
        <button data-tab="lesson" class="${tab === 'lesson' ? 'active' : ''}">New lesson</button>
        <button data-tab="quiz" class="${tab === 'quiz' ? 'active' : ''}">New quiz</button>
      </div>
      <div id="studioBody" style="margin-top:18px"></div>
    `;
    view.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    if (tab === 'lesson') drawLessonForm(); else drawQuizForm();
  }

  function drawLessonForm() {
    const body = view.querySelector('#studioBody');
    body.innerHTML = `
      <div class="grid grid-2" style="align-items:start">
        <div class="card">
          <b>Draft with AI</b>
          <p class="muted" style="margin-top:6px">Generate a starting point, then edit before publishing.</p>
          <form id="aiLessonForm" style="margin-top:14px">
            <div class="field"><label>Language</label><input name="language" placeholder="Spanish" required></div>
            <div class="field"><label>Level</label><select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></div>
            <div class="field"><label>Topic</label><input name="topic" placeholder="At the airport" required></div>
            <button class="btn full" type="submit">${icon('sparkles', 16)} Generate draft</button>
          </form>
        </div>
        <form class="card" id="lessonForm">
          <b>Lesson</b>
          <div class="field" style="margin-top:12px"><label>Title</label><input name="title" required></div>
          <div class="field"><label>Description</label><textarea name="description"></textarea></div>
          <div class="field"><label>Language</label><input name="language" required></div>
          <div class="field"><label>Level</label><select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></div>
          <div class="field"><label>Vocabulary (one per line: term | translation)</label><textarea name="vocab" placeholder="Hola | Hello" rows="5"></textarea></div>
          <div class="field"><label>Grammar explanation</label><textarea name="grammar"></textarea></div>
          <div class="field"><label>Study tip</label><input name="tip"></div>
          <button class="btn full" type="submit">Publish lesson</button>
        </form>
      </div>
    `;

    body.querySelector('#aiLessonForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = 'Generating...';
      try {
        const data = new FormData(e.target);
        const draft = await post('/lessons/generate', { language: data.get('language'), level: data.get('level'), topic: data.get('topic') });
        const form = body.querySelector('#lessonForm');
        form.title.value = draft.title || '';
        form.description.value = draft.description || '';
        form.language.value = draft.language || data.get('language');
        form.level.value = draft.level || data.get('level');
        form.vocab.value = (draft.vocabulary || []).map(v => `${v.term} | ${v.translation}`).join('\n');
        form.grammar.value = draft.grammar?.explanation || '';
        form.tip.value = draft.tip || '';
        showToast('Draft ready — review and publish');
      } catch (error) { showToast(error.message); }
      finally { btn.disabled = false; btn.innerHTML = `${icon('sparkles', 16)} Generate draft`; }
    });

    body.querySelector('#lessonForm').addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const vocabulary = data.get('vocab').split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const [term, translation] = line.split('|').map(s => s.trim());
        return { term, translation: translation || term };
      });
      try {
        await post('/lessons', {
          title: data.get('title'), description: data.get('description'), language: data.get('language'), level: data.get('level'),
          content: { vocabulary, grammar: { explanation: data.get('grammar') }, tip: data.get('tip') }
        });
        showToast('Lesson published'); e.target.reset();
      } catch (error) { showToast(error.message); }
    });
  }

  function drawQuizForm() {
    const body = view.querySelector('#studioBody');
    body.innerHTML = `
      <div class="card">
        <b>Generate & publish a quiz</b>
        <p class="muted" style="margin-top:6px">AI drafts the questions; publishing makes it available to all students.</p>
        <form id="quizForm" style="margin-top:14px">
          <div class="field"><label>Language</label><input name="language" placeholder="Spanish" required></div>
          <div class="field"><label>Level</label><select name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></div>
          <div class="field"><label>Topic</label><input name="topic" placeholder="Ordering food" required></div>
          <div class="field"><label>Questions</label><input name="count" type="number" min="3" max="20" value="8"></div>
          <button class="btn full" type="submit">Generate & publish</button>
        </form>
      </div>
    `;
    body.querySelector('#quizForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true; btn.textContent = 'Working...';
      try {
        const data = new FormData(e.target);
        const draft = await post('/quizzes/generate', { language: data.get('language'), level: data.get('level'), topic: data.get('topic'), count: Number(data.get('count')) });
        await post('/quizzes', { title: draft.title, language: draft.language, level: data.get('level'), topic: data.get('topic'), questions: draft.questions, source: 'ai' });
        showToast('Quiz published'); e.target.reset();
      } catch (error) { showToast(error.message); }
      finally { btn.disabled = false; btn.textContent = 'Generate & publish'; }
    });
  }

  draw();
}
