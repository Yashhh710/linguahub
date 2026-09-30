import { get, put, post } from '../api.js';
import { renderShell } from '../shell.js';
import { icon } from '../icons.js';
import { announceGains } from '../toast.js';
import { flagForLanguage, lessonPhoto } from './lessons.js';

const SPEECH_LOCALE = { Spanish: 'es-ES', French: 'fr-FR', Japanese: 'ja-JP', English: 'en-US', Afrikaans: 'af-ZA' };

export async function renderLessonDetail(id) {
  const view = renderShell('#/lessons', 'Lesson', 'Vocabulary, grammar, and speaking practice');
  view.classList.add('lesson-detail-view');
  view.innerHTML = `<div class="card skeleton" style="height:300px"></div>`;

  const [lesson, myProgress] = await Promise.all([
    get(`/lessons/${id}`), get(`/progress/lessons/${id}`)
  ]).catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });

  const startedAt = Date.now();
  let completed = myProgress.completed;
  let cardIndex = 0;
  const vocab = lesson.content?.vocabulary || [];

  function draw() {
    const grammar = lesson.content?.grammar || {};
    const examples = lesson.content?.examples || [];
    view.innerHTML = `
      <a class="lesson-back-link" href="#/lessons">&larr; Back to lessons</a>
      <section class="card lesson-detail-hero" aria-labelledby="lessonTitle">
        <img class="lesson-detail-cover" src="${escapeHtml(lessonPhoto(lesson))}" alt="${escapeHtml(lesson.language)} lesson scenery" onerror="this.onerror=null;this.src='/assets/travel.jpg'">
        <div class="lesson-detail-hero-copy">
          <div class="lesson-detail-meta">
            <span class="lesson-detail-level">${escapeHtml(lesson.level || 'A1')}</span>
            <span class="lesson-detail-language"><span class="lesson-detail-flag">${flagForLanguage(lesson.language)}</span>${escapeHtml(lesson.language)}</span>
            ${completed ? `<span class="lesson-detail-completed">${icon('check', 13)} Completed</span>` : ''}
          </div>
          <h2 id="lessonTitle">${escapeHtml(lesson.title)}</h2>
          <p class="lesson-detail-description">${escapeHtml(lesson.description || `Learn useful phrases and everyday expressions in ${lesson.language}.`)}</p>
          <div class="lesson-detail-stats">
            <span>${icon('progress', 15)} ${Number(lesson.estimatedMinutes) || 10} min</span>
            <span>${icon('learn', 15)} ${vocab.length} phrases</span>
            <span>${icon('star', 15)} +${Number(lesson.xpReward) || 0} XP</span>
          </div>
          <button class="btn lesson-start-button" type="button" data-scroll-to="lesson-vocabulary">${icon('play', 14)} ${completed ? 'Review Lesson' : 'Start Lesson'}</button>
        </div>
      </section>

      <nav class="lesson-detail-tabs" aria-label="Lesson sections">
        ${[
          ['lesson-content', 'Lesson Content'], ['lesson-vocabulary', 'Vocabulary'], ['lesson-grammar', 'Grammar'],
          ['lesson-examples', 'Examples'], ['lesson-notes', 'Notes'], ['lesson-resources', 'Resources']
        ].map(([target, label], index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-lesson-target="${target}" aria-current="${index === 0 ? 'location' : 'false'}">${label}</button>`).join('')}
      </nav>

      <div class="lesson-detail-columns" id="lesson-content">
        <div class="lesson-detail-main">
          <section class="card lesson-content-section" id="lesson-vocabulary">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon">${icon('learn', 20)}</span>
              <div><h3>Vocabulary</h3><p>Learn and practice essential words and phrases.</p></div>
              <span class="lesson-section-count">${vocab.length ? `${cardIndex + 1} / ${vocab.length}` : '0 phrases'}</span>
            </div>
            ${vocab.length ? flashcard(vocab[cardIndex], cardIndex, vocab.length) : '<div class="lesson-empty-content">No vocabulary in this lesson yet.</div>'}
            ${vocab.length ? `<div class="lesson-vocab-controls">
              <button class="btn secondary small" id="prevCard" ${cardIndex === 0 ? 'disabled' : ''}>${icon('chevronRight', 14)} Previous</button>
              <button class="btn small" id="nextCard" ${cardIndex === vocab.length - 1 ? 'disabled' : ''}>Next ${icon('chevronRight', 14)}</button>
            </div>` : ''}
          </section>

          <section class="card lesson-content-section" id="lesson-grammar">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon grammar-icon">${icon('progress', 20)}</span>
              <div><h3>Grammar</h3><p>Learn the basic rules and structure of ${escapeHtml(lesson.language)}.</p></div>
            </div>
            ${grammar.explanation ? `<article class="lesson-subsection"><h4>${escapeHtml(grammar.title || 'Grammar notes')}</h4><p>${escapeHtml(grammar.explanation)}</p></article>` : '<div class="lesson-empty-content">No grammar notes for this lesson yet.</div>'}
          </section>

          <section class="card lesson-content-section" id="lesson-examples">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon examples-icon">${icon('friends', 20)}</span>
              <div><h3>Examples</h3><p>See how the words are used in real conversations.</p></div>
            </div>
            ${examples.length ? `<div class="lesson-example-list">${examples.map((example, index) => `<article class="lesson-example-row"><span class="lesson-example-number">${index + 1}</span><div><strong>${escapeHtml(example.text)}</strong>${example.translation ? `<small>${escapeHtml(example.translation)}</small>` : ''}</div></article>`).join('')}</div>` : '<div class="lesson-empty-content">No examples for this lesson yet.</div>'}
          </section>

          <section class="card lesson-content-section" id="lesson-notes">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon notes-icon">${icon('sparkles', 20)}</span>
              <div><h3>Notes</h3><p>A small reminder to help this lesson stick.</p></div>
            </div>
            <article class="lesson-subsection lesson-study-tip"><h4>Study tip</h4><p>${escapeHtml(lesson.content?.tip || 'Review the vocabulary, then practice saying each phrase aloud.')}</p></article>
          </section>

          <section class="card lesson-content-section" id="lesson-resources">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon resources-icon">${icon('star', 20)}</span>
              <div><h3>Resources</h3><p>Keep practicing with the tools in this lesson.</p></div>
            </div>
            <div class="lesson-resource-list">
              <button type="button" data-scroll-to="lesson-speaking"><span>${icon('mic', 17)}</span><div><strong>Speaking practice</strong><small>Practice a phrase and hear your pronunciation score.</small></div>${icon('chevronRight', 16)}</button>
              <button type="button" data-scroll-to="lesson-vocabulary"><span>${icon('learn', 17)}</span><div><strong>Vocabulary cards</strong><small>Review ${vocab.length} phrases from this lesson.</small></div>${icon('chevronRight', 16)}</button>
            </div>
          </section>
        </div>

        <aside class="lesson-detail-aside">
          <section class="card lesson-speaking-card" id="lesson-speaking">
            <div class="lesson-section-heading">
              <span class="lesson-section-icon speaking-icon">${icon('mic', 20)}</span>
              <div><h3>Speaking Practice</h3><p>Improve your pronunciation and confidence.</p></div>
            </div>
            <div id="voicePractice" class="lesson-voice-practice"></div>
            <button class="btn full lesson-complete-button" id="completeBtn" ${completed ? 'disabled' : ''}>
              ${icon('check', 15)} ${completed ? 'Lesson completed' : `Mark complete · +${Number(lesson.xpReward) || 0} XP`}
            </button>
          </section>
        </aside>
      </div>
    `;

    view.querySelectorAll('[data-lesson-target]').forEach(button => {
      button.addEventListener('click', () => {
        view.querySelectorAll('[data-lesson-target]').forEach(tab => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-current', active ? 'location' : 'false');
        });
        view.querySelector(`#${button.dataset.lessonTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    view.querySelectorAll('[data-scroll-to]').forEach(button => {
      button.addEventListener('click', () => {
        view.querySelector(`#${button.dataset.scrollTo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (vocab.length) {
      view.querySelector('#prevCard')?.addEventListener('click', () => { cardIndex = Math.max(0, cardIndex - 1); draw(); });
      view.querySelector('#nextCard')?.addEventListener('click', () => { cardIndex = Math.min(vocab.length - 1, cardIndex + 1); draw(); });
      view.querySelector('#listenWord')?.addEventListener('click', () => speakText(vocab[cardIndex].term, lesson.language));
      mountVoicePractice(view.querySelector('#voicePractice'), lesson.language, vocab[cardIndex]);
    }

    view.querySelector('#completeBtn')?.addEventListener('click', async e => {
      e.target.disabled = true; e.target.textContent = 'Saving...';
      try {
        const timeSpentSec = Math.round((Date.now() - startedAt) / 1000);
        const { gains } = await put(`/progress/lessons/${id}`, { completed: true, timeSpentSec });
        completed = true;
        announceGains(gains);
        draw();
      } catch (error) {
        e.target.disabled = false; e.target.textContent = 'Try again';
      }
    });
  }
  draw();
}

function flashcard(item, index, count) {
  return `<article class="lesson-vocabulary-card">
    <div class="lesson-vocab-card-top"><span class="lesson-example-number">${index + 1}</span><span>${index + 1} of ${count}</span><button type="button" id="listenWord" class="lesson-listen-button" aria-label="Listen to ${escapeHtml(item.term)}">${icon('play', 14)}</button></div>
    <p class="lesson-vocab-translation">${escapeHtml(item.translation)}</p>
    <h4>${escapeHtml(item.term)}</h4>
    ${item.pronunciation ? `<p class="lesson-vocab-pronunciation">/${escapeHtml(item.pronunciation)}/</p>` : ''}
    ${item.example ? `<p class="lesson-vocab-example">${escapeHtml(item.example)}</p>` : ''}
  </article>`;
}

function speakText(text, language) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LOCALE[language] || 'en-US';
  window.speechSynthesis.speak(utterance);
}

function mountVoicePractice(container, language, vocabItem) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const expectedText = vocabItem?.term || '';
  if (!Recognition || !expectedText) {
    container.innerHTML = `<p class="muted">${!expectedText ? 'No phrase to practice yet.' : 'Speech recognition isn\'t supported in this browser — try Chrome on desktop or Android.'}</p>`;
    return;
  }
  container.innerHTML = `
    <p class="lesson-speaking-prompt">Practice “${escapeHtml(expectedText)}”</p>
    <button type="button" class="lesson-voice-trigger" id="recBtn" aria-label="Tap to practice ${escapeHtml(expectedText)}">
      <span class="lesson-voice-mic">${icon('mic', 38)}</span>
      <span class="lesson-voice-label">Tap the mic and say the word out loud.</span>
    </button>
    <div id="recResult" style="margin-top:10px"></div>`;

  container.querySelector('#recBtn').addEventListener('click', () => {
    const recognizer = new Recognition();
    recognizer.lang = SPEECH_LOCALE[language] || 'en-US';
    recognizer.maxAlternatives = 1;
    const resultBox = container.querySelector('#recResult');
    const btn = container.querySelector('#recBtn');
    btn.disabled = true;
    btn.querySelector('.lesson-voice-label').textContent = 'Listening...';

    recognizer.onresult = async event => {
      const heardText = event.results[0][0].transcript;
      try {
        const { attempt, gains } = await post('/voice/attempts', { language, expectedText, heardText });
        resultBox.innerHTML = `<div class="lesson-voice-result">
          <span>You said: “${escapeHtml(heardText)}”</span><b class="${attempt.accuracy >= 70 ? 'is-accurate' : 'needs-practice'}">${attempt.accuracy}%</b>
        </div>`;
        announceGains(gains);
      } catch (error) {
        resultBox.innerHTML = `<p class="muted">${error.message}</p>`;
      }
    };
    recognizer.onerror = () => { resultBox.innerHTML = `<p class="muted">Couldn't hear that clearly — try again.</p>`; };
    recognizer.onend = () => {
      btn.disabled = false;
      btn.querySelector('.lesson-voice-label').textContent = 'Tap the mic and say the word out loud.';
    };
    recognizer.start();
  });
}

function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
