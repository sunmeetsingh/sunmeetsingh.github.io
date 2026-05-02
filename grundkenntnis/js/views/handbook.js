import { esc } from '../utils.js';
import { navigate } from '../router.js';

const CHAPTER_ORDER = [
  'Die Geschichte der Schweiz',
  'Die Politik in der Schweiz',
  'Rechte und Pflichten in der Bundesverfassung',
  'Gesetze in der Schweiz',
  'Sozialversicherungen',
  'Feste, Traditionen und Kultur',
  'Die Geografie der Schweiz',
  'Der Kanton Zürich',
  'Kunst und Kultur',
  'Schulsystem',
  'Glossar',
];

export function renderHandbook(handbook, activeSectionId = null) {
  const chapters = [...new Set(handbook.map(s => s.chapter))]
    .sort((a, b) => CHAPTER_ORDER.indexOf(a) - CHAPTER_ORDER.indexOf(b));

  const activeSection = activeSectionId
    ? handbook.find(s => s.id === activeSectionId)
    : null;
  const activeChapter = activeSection?.chapter || chapters[0];

  const chapterSections = handbook.filter(s => s.chapter === activeChapter);

  const html = `
    <div style="margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      <h2 style="font-size:1rem;font-weight:800">Handbuch</h2>
      <button class="btn btn-ghost btn-sm" data-nav="/">✕</button>
    </div>

    <div class="handbook-chapters" id="chapter-list">
      ${chapters.map(ch => `
        <button class="ch-btn ${ch === activeChapter ? 'active' : ''}" data-chapter="${esc(ch)}">
          ${esc(ch)}
        </button>
      `).join('')}
    </div>

    <div id="section-view">
      ${chapterSections.length === 0
        ? '<p class="text-muted">Keine Inhalte verfügbar.</p>'
        : chapterSections.map(s => `
          <div class="card section-item" style="margin-bottom:.5rem" data-section="${esc(s.id)}">
            <div class="section-heading">${esc(s.heading)}</div>
            <div class="section-text">${esc(s.text)}</div>
          </div>
        `).join('')}
    </div>
  `;

  return [html, (container) => {
    // Chapter switch
    container.querySelectorAll('[data-chapter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.chapter;
        const secs = handbook.filter(s => s.chapter === ch);

        container.querySelectorAll('[data-chapter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelector('#section-view').innerHTML = secs.map(s => `
          <div class="card section-item" style="margin-bottom:.5rem" data-section="${esc(s.id)}">
            <div class="section-heading">${esc(s.heading)}</div>
            <div class="section-text">${esc(s.text)}</div>
          </div>
        `).join('');
      });
    });

    // Scroll to active section
    if (activeSection) {
      requestAnimationFrame(() => {
        const el = container.querySelector(`[data-section="${esc(activeSectionId)}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    container.querySelector('[data-nav]').addEventListener('click', e => {
      navigate(e.currentTarget.dataset.nav.replace(/^\//, ''));
    });
  }];
}
