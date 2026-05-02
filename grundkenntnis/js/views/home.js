import { esc, pct, TOPIC_COLORS, TOPIC_SHORT } from '../utils.js';
import { StorageAdapter } from '../storage.js';
import { navigate } from '../router.js';

const ALL_TOPICS = [
  'Demokratie und Föderalismus',
  'Sozialstaat und Zivilgesellschaft',
  'Geschichte',
  'Geografie',
  'Kultur und Alltagskultur',
];

export function renderHome(questions) {
  const progress = StorageAdapter.getAllProgress();
  const meta     = StorageAdapter.getMeta();

  const totalAnswered = meta.total_questions_answered || 0;
  const totalSessions = meta.total_sessions           || 0;
  const allAttempted  = Object.values(progress);
  const allCorrect    = allAttempted.reduce((s, p) => s + (p.correct || 0), 0);
  const allAttempts   = allAttempted.reduce((s, p) => s + (p.attempts || 0), 0);
  const overallPct    = pct(allCorrect, allAttempts);

  const topicRows = ALL_TOPICS.map(topic => {
    const topicQs = questions.filter(q => q.topic === topic);
    const count   = topicQs.length;
    const attempted = topicQs.filter(q => progress[q.id]);
    const correct   = attempted.reduce((s, q) => s + (progress[q.id]?.correct || 0), 0);
    const attempts  = attempted.reduce((s, q) => s + (progress[q.id]?.attempts || 0), 0);
    const color     = TOPIC_COLORS[topic];
    const shortName = TOPIC_SHORT[topic];
    const accuracy  = pct(correct, attempts);
    return { topic, shortName, count, accuracy, color };
  });

  const html = `
    <div class="home-hero">
      <h1>🇨🇭 Grundkenntnis Test</h1>
      <p>Kanton Zürich · ${questions.length} Fragen</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="val">${totalAnswered}</div>
        <div class="lbl">Beantwortet</div>
      </div>
      <div class="stat-card">
        <div class="val">${overallPct}%</div>
        <div class="lbl">Richtig</div>
      </div>
      <div class="stat-card">
        <div class="val">${totalSessions}</div>
        <div class="lbl">Tests</div>
      </div>
    </div>

    <div class="topics-grid">
      ${topicRows.map(t => `
        <div class="topic-card" data-nav="/quiz?topic=${encodeURIComponent(t.topic)}">
          <div style="display:flex;align-items:center;gap:.5rem">
            <span class="tc-dot" style="background:${t.color}"></span>
            <span class="tc-name">${esc(t.shortName)}</span>
          </div>
          <span class="tc-count">${t.count} Fragen</span>
          <div class="topic-bar-row">
            <div class="topic-bar-bg">
              <div class="topic-bar-fill" style="width:${t.accuracy}%;background:${t.color}"></div>
            </div>
            <span class="topic-bar-pct">${t.accuracy}%</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="home-actions">
      <button class="btn btn-primary btn-full" data-action="random">
        Zufallstest starten (20 Fragen)
      </button>
      <button class="btn btn-secondary btn-full" data-nav="/quiz">
        Thema wählen
      </button>
    </div>
  `;

  return [html, (container) => {
    container.addEventListener('click', e => {
      const el = e.target.closest('[data-action],[data-nav]');
      if (!el) return;

      if (el.dataset.action === 'random') {
        // Store config in sessionStorage for the player to pick up
        sessionStorage.setItem('gk_quiz_config', JSON.stringify({
          topicFilter: null, subtopicFilter: null, count: 20, mode: 'learn',
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
