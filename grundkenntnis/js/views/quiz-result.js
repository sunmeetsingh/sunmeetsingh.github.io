import { esc, pct } from '../utils.js';
import { navigate } from '../router.js';

export function renderQuizResult(allQuestions) {
  const snapStr = sessionStorage.getItem('gk_last_result');
  if (!snapStr) { navigate('/'); return ['', null]; }
  const snap = JSON.parse(snapStr);

  const qById = Object.fromEntries(allQuestions.map(q => [q.id, q]));
  const total   = snap.questionIds.length;
  const correct = snap.questionIds.filter(id => snap.answers?.[id]?.correct).length;
  const score   = pct(correct, total);

  const wrongIds = snap.questionIds.filter(id => snap.answers?.[id] && !snap.answers[id].correct);

  const scoreColor = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--topic-geschichte)' : 'var(--wrong)';

  const html = `
    <div class="card result-score">
      <div class="score-num" style="color:${scoreColor}">${correct}/${total}</div>
      <div class="score-pct">${score}%</div>
      <div class="score-label" style="margin-top:.5rem">
        ${score >= 70 ? '🎉 Gut gemacht!' : score >= 50 ? '📚 Weiterüben!' : '💪 Nicht aufgeben!'}
      </div>
    </div>

    <div class="flex-gap mt-1">
      <button class="btn btn-primary" style="flex:1" data-action="again">
        Nochmals
      </button>
      ${wrongIds.length > 0 ? `
        <button class="btn btn-secondary" style="flex:1" data-action="retry-wrong">
          Falsche üben (${wrongIds.length})
        </button>
      ` : ''}
    </div>

    <button class="btn btn-ghost btn-full mt-1" data-nav="/">← Zur Übersicht</button>

    ${wrongIds.length > 0 ? `
      <div class="section-title">Falsch beantwortet</div>
      <div class="wrong-list">
        ${wrongIds.map(id => {
          const q = qById[id];
          if (!q) return '';
          const ans = snap.answers[id];
          return `
            <div class="card wrong-item">
              <div class="wi-q">${esc(q.text)}</div>
              <div class="wi-your">✗ Deine Antwort: ${esc(q.options[ans.selected])}</div>
              <div class="wi-correct">✓ Richtig: ${esc(q.options[q.answer])}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;

  return [html, (container) => {
    container.addEventListener('click', e => {
      const el = e.target.closest('[data-action],[data-nav]');
      if (!el) return;

      if (el.dataset.action === 'again') {
        sessionStorage.setItem('gk_quiz_config', JSON.stringify(snap.config));
        navigate('quiz/play');
        return;
      }
      if (el.dataset.action === 'retry-wrong') {
        sessionStorage.setItem('gk_quiz_config', JSON.stringify({
          ...snap.config,
          wrongIds,
          count: 'all',
        }));
        navigate('quiz/play');
        return;
      }
      if (el.dataset.nav) {
        navigate(el.dataset.nav.replace(/^\//, ''));
      }
    });
  }];
}
