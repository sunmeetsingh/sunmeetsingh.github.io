import { esc, pct, formatDate, TOPIC_COLORS, TOPIC_SHORT } from '../utils.js';
import { StorageAdapter } from '../storage.js';
import { navigate } from '../router.js';

const ALL_TOPICS = [
  'Demokratie und Föderalismus',
  'Sozialstaat und Zivilgesellschaft',
  'Geschichte',
  'Geografie',
  'Kultur und Alltagskultur',
];

export function renderStats(questions) {
  const progress = StorageAdapter.getAllProgress();
  const sessions = StorageAdapter.getSessions(10);
  const meta     = StorageAdapter.getMeta();

  const topicStats = ALL_TOPICS.map(topic => {
    const qs       = questions.filter(q => q.topic === topic);
    const attempts = qs.reduce((s, q) => s + (progress[q.id]?.attempts || 0), 0);
    const correct  = qs.reduce((s, q) => s + (progress[q.id]?.correct  || 0), 0);
    const accuracy = pct(correct, attempts);
    const color    = TOPIC_COLORS[topic];
    return { topic, shortName: TOPIC_SHORT[topic], accuracy, attempts, color };
  });

  const allAttempts = Object.values(progress).reduce((s, p) => s + p.attempts, 0);
  const allCorrect  = Object.values(progress).reduce((s, p) => s + p.correct,  0);
  const overallPct  = pct(allCorrect, allAttempts);

  const html = `
    <div style="margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      <h2 style="font-size:1rem;font-weight:800">Fortschritt</h2>
      <button class="btn btn-ghost btn-sm" data-nav="/">✕</button>
    </div>

    <div class="stats-row" style="margin-bottom:1.25rem">
      <div class="stat-card">
        <div class="val">${meta.total_questions_answered || 0}</div>
        <div class="lbl">Beantwortet</div>
      </div>
      <div class="stat-card">
        <div class="val">${overallPct}%</div>
        <div class="lbl">Richtig</div>
      </div>
      <div class="stat-card">
        <div class="val">${meta.total_sessions || 0}</div>
        <div class="lbl">Tests</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="section-title" style="margin-top:0">Genauigkeit nach Thema</div>
      ${topicStats.map(t => `
        <div class="stats-topic">
          <div class="st-name">
            <span>${esc(t.shortName)}</span>
            <span style="color:var(--muted);font-weight:400">${t.accuracy}%</span>
          </div>
          <div class="st-bar-bg">
            <div class="st-bar-fill" style="width:${t.accuracy}%;background:${t.color}"></div>
          </div>
        </div>
      `).join('')}
    </div>

    ${sessions.length > 0 ? `
      <div class="card">
        <div class="section-title" style="margin-top:0">Letzte Tests</div>
        <div class="session-list">
          ${sessions.map(s => `
            <div class="session-item">
              <span class="si-date">${formatDate(s.started_at)}</span>
              <span>${esc(s.topic_filter ? TOPIC_SHORT[s.topic_filter] || s.topic_filter : 'Alle')}</span>
              <span class="si-score" style="color:${pct(s.correct, s.total) >= 70 ? 'var(--green)' : 'var(--wrong)'}">
                ${s.correct}/${s.total}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `<p class="text-muted text-small text-center">Noch keine Tests abgeschlossen.</p>`}

    <div style="margin-top:1rem;text-align:center">
      <button class="btn btn-ghost btn-sm" id="reset-btn" style="color:var(--muted)">
        Fortschritt zurücksetzen
      </button>
    </div>
  `;

  return [html, (container) => {
    container.querySelector('[data-nav]').addEventListener('click', e => {
      navigate(e.currentTarget.dataset.nav.replace(/^\//, ''));
    });
    container.querySelector('#reset-btn').addEventListener('click', () => {
      if (confirm('Gesamten Fortschritt löschen? Das kann nicht rückgängig gemacht werden.')) {
        StorageAdapter.importAll({ progress: {}, sessions: [], meta: {} });
        navigate('/');
      }
    });
  }];
}
