import { esc, TOPIC_SHORT, TOPIC_COLORS } from '../utils.js';
import { navigate } from '../router.js';
import { startSession, getSession, recordAnswer, advance, finalize, clearSession } from '../quiz.js';

const LETTERS = ['a', 'b', 'c', 'd'];

export function renderQuizPlayer(allQuestions, handbook) {
  // Load or create session
  let session = getSession();
  if (!session || session.completed) {
    const configStr = sessionStorage.getItem('gk_quiz_config');
    if (!configStr) { navigate('/'); return ['', null]; }
    const config = JSON.parse(configStr);
    session = startSession(allQuestions, config);
    sessionStorage.removeItem('gk_quiz_config');
  }

  const qById = Object.fromEntries(allQuestions.map(q => [q.id, q]));
  const secById = Object.fromEntries(handbook.map(s => [s.id, s]));

  function renderQuestion(session) {
    const idx = session.cursor;
    if (idx >= session.questionIds.length) {
      // All answered — finalize and go to result
      const snap = finalize();
      sessionStorage.setItem('gk_last_result', JSON.stringify(snap));
      navigate('quiz/result');
      return;
    }

    const q   = qById[session.questionIds[idx]];
    const total = session.questionIds.length;
    const fillPct = Math.round((idx / total) * 100);
    const topicColor = TOPIC_COLORS[q.topic] || 'var(--red)';
    const topicShort = TOPIC_SHORT[q.topic]  || q.topic;
    const mode = session.config.mode;

    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width:${fillPct}%"></div>
        </div>
        <span class="quiz-progress-label">${idx + 1}/${total}</span>
        <button class="quiz-close" id="quiz-close" title="Beenden">✕</button>
      </div>

      <div class="card" id="q-card">
        <div class="quiz-topic-chip" style="color:${topicColor}">
          ${esc(topicShort)} · ${esc(q.subtopic || '')}
        </div>

        <div class="question-text">${esc(q.text)}</div>

        <div class="options-list" id="options">
          ${LETTERS.map(l => `
            <button class="option-btn" data-letter="${l}" id="opt-${l}">
              <span class="option-letter">${l}</span>
              <span>${esc(q.options[l])}</span>
            </button>
          `).join('')}
        </div>

        <div class="quiz-footer">
          <button class="btn btn-primary btn-full hidden" id="btn-submit" disabled>
            Antworten
          </button>
          <button class="btn btn-primary btn-full hidden" id="btn-next">
            Weiter →
          </button>

          <div class="explain-section hidden" id="explain-section">
            <button class="explain-toggle" id="explain-toggle">
              📖 Aus dem Handbuch
              <span id="explain-arrow">▸</span>
            </button>
            <div class="explain-body" id="explain-body">
              ${buildExplanation(q, secById)}
            </div>
          </div>
        </div>
      </div>
    `;

    window.scrollTo(0, 0);

    // ── Event listeners ──────────────────────────────────────────────────
    let selected = null;
    let submitted = false;

    // Option selection
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (submitted) return;
        container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.letter;
        container.querySelector('#btn-submit').disabled = false;
        container.querySelector('#btn-submit').classList.remove('hidden');
      });
    });

    // Submit
    container.querySelector('#btn-submit').addEventListener('click', () => {
      if (!selected || submitted) return;
      submitted = true;
      const correct = selected === q.answer;

      recordAnswer(q.id, selected, correct);

      // Show feedback
      container.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.letter === q.answer) btn.classList.add('correct');
        else if (btn.dataset.letter === selected) btn.classList.add('wrong');
      });

      container.querySelector('#btn-submit').classList.add('hidden');
      container.querySelector('#btn-next').classList.remove('hidden');

      // Show explanation
      const explainSec = container.querySelector('#explain-section');
      if (q.handbook_section_ids?.length || q.explanation) {
        explainSec.classList.remove('hidden');
        // Auto-open in learn mode on wrong answer
        if (mode === 'learn' && !correct) {
          container.querySelector('#explain-body').classList.add('open');
          container.querySelector('#explain-arrow').textContent = '▾';
        }
      }
    });

    // Explain toggle
    container.querySelector('#explain-toggle').addEventListener('click', () => {
      const body  = container.querySelector('#explain-body');
      const arrow = container.querySelector('#explain-arrow');
      const open  = body.classList.toggle('open');
      arrow.textContent = open ? '▾' : '▸';
    });

    // Next
    container.querySelector('#btn-next').addEventListener('click', () => {
      advance();
      renderQuestion(getSession());
    });

    // Close quiz
    container.querySelector('#quiz-close').addEventListener('click', () => {
      if (confirm('Quiz abbrechen?')) {
        clearSession();
        navigate('/');
      }
    });
  }

  // Return initial render (will immediately call renderQuestion which sets innerHTML)
  return [`<div class="loading">Lade Quiz…</div>`, () => {
    renderQuestion(session);
  }];
}

function buildExplanation(q, secById) {
  if (q.explanation) {
    return `<p>${esc(q.explanation)}</p>`;
  }
  if (!q.handbook_section_ids?.length) return '<p>Keine Erklärung verfügbar.</p>';

  // Show up to 2 most relevant sections
  const sections = q.handbook_section_ids
    .slice(0, 2)
    .map(id => secById[id])
    .filter(Boolean);

  if (!sections.length) return '<p>Keine Erklärung verfügbar.</p>';

  return sections.map(s => `
    <h4>${esc(s.heading)}</h4>
    <p>${esc(s.text.slice(0, 600))}${s.text.length > 600 ? '…' : ''}</p>
  `).join('');
}
