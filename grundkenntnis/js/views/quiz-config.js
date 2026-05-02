import { esc, TOPIC_SHORT } from '../utils.js';
import { navigate } from '../router.js';

const TOPICS = [
  'Demokratie und Föderalismus',
  'Sozialstaat und Zivilgesellschaft',
  'Geschichte',
  'Geografie',
  'Kultur und Alltagskultur',
];

export function renderQuizConfig(questions) {
  // Pre-select topic from URL param if present
  const hash = window.location.hash;
  const m = hash.match(/topic=([^&]+)/);
  const preselect = m ? decodeURIComponent(m[1]) : null;

  const html = `
    <div style="margin-bottom:1.25rem">
      <button class="btn btn-ghost btn-sm" data-nav="/">← Zurück</button>
    </div>

    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem">Test konfigurieren</h2>

      <div class="config-section">
        <label>Thema</label>
        <div class="pill-group" id="topic-pills">
          <button class="pill ${!preselect ? 'active' : ''}" data-topic="">Alle</button>
          ${TOPICS.map(t => `
            <button class="pill ${preselect === t ? 'active' : ''}" data-topic="${esc(t)}">
              ${esc(TOPIC_SHORT[t])}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="config-section" id="subtopic-section" style="display:none">
        <label>Ebene</label>
        <div class="pill-group" id="subtopic-pills">
          <button class="pill active" data-subtopic="">Alle</button>
          <button class="pill" data-subtopic="Bund">Bund</button>
          <button class="pill" data-subtopic="Kanton">Kanton</button>
          <button class="pill" data-subtopic="Gemeinde">Gemeinde</button>
        </div>
      </div>

      <div class="config-section">
        <label>Anzahl Fragen</label>
        <div class="pill-group" id="count-pills">
          <button class="pill" data-count="10">10</button>
          <button class="pill active" data-count="20">20</button>
          <button class="pill" data-count="30">30</button>
          <button class="pill" data-count="all">Alle</button>
        </div>
      </div>

      <div class="config-section">
        <label>Modus</label>
        <div class="pill-group" id="mode-pills">
          <button class="pill active" data-mode="learn">Lernmodus <span style="font-weight:400;font-size:.75em">(mit Erklärung)</span></button>
          <button class="pill" data-mode="exam">Prüfungsmodus</button>
        </div>
      </div>

      <div id="pool-count" style="font-size:.8rem;color:var(--muted);margin-bottom:1rem"></div>

      <button class="btn btn-primary btn-full" id="start-btn">Test starten</button>
    </div>
  `;

  return [html, (container) => {
    let topicFilter    = preselect || '';
    let subtopicFilter = '';
    let count          = 20;
    let mode           = 'learn';

    function updatePoolCount() {
      let pool = questions;
      if (topicFilter)    pool = pool.filter(q => q.topic === topicFilter);
      if (subtopicFilter) pool = pool.filter(q => q.subtopic === subtopicFilter);
      const available = pool.length;
      const actual = count === 'all' ? available : Math.min(Number(count), available);
      container.querySelector('#pool-count').textContent =
        `${available} verfügbare Fragen · ${actual} werden gestellt`;
    }

    function pillGroup(selector, attr, setter) {
      container.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          setter(btn.dataset[attr]);
          updatePoolCount();
        });
      });
    }

    pillGroup('[data-topic]', 'topic', v => {
      topicFilter = v;
      const subSec = container.querySelector('#subtopic-section');
      subSec.style.display = v ? '' : 'none';
      if (!v) {
        subtopicFilter = '';
        container.querySelectorAll('[data-subtopic]').forEach(b => {
          b.classList.toggle('active', b.dataset.subtopic === '');
        });
      }
    });
    pillGroup('[data-subtopic]', 'subtopic', v => { subtopicFilter = v; });
    pillGroup('[data-count]',    'count',    v => { count = v === 'all' ? 'all' : Number(v); });
    pillGroup('[data-mode]',     'mode',     v => { mode = v; });

    // Show subtopic row if topic was preselected
    if (preselect) container.querySelector('#subtopic-section').style.display = '';

    updatePoolCount();

    container.querySelector('#start-btn').addEventListener('click', () => {
      sessionStorage.setItem('gk_quiz_config', JSON.stringify({
        topicFilter: topicFilter || null,
        subtopicFilter: subtopicFilter || null,
        count,
        mode,
      }));
      navigate('quiz/play');
    });

    container.querySelector('[data-nav]').addEventListener('click', e => {
      navigate(e.currentTarget.dataset.nav.replace(/^\//, ''));
    });
  }];
}
