import { esc, TOPIC_SHORT, TOPIC_COLORS } from '../utils.js';
import { StorageAdapter } from '../storage.js';
import { navigate } from '../router.js';

export function renderReview(questions) {
  const progress = StorageAdapter.getAllProgress();

  const html = `
    <div style="margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      <h2 style="font-size:1rem;font-weight:800">Alle Fragen</h2>
      <button class="btn btn-ghost btn-sm" data-nav="/">✕</button>
    </div>

    <div class="filter-row" id="filters">
      <button class="pill active" data-filter-topic="">Alle Themen</button>
      <button class="pill" data-filter-topic="Demokratie und Föderalismus">Demokratie</button>
      <button class="pill" data-filter-topic="Sozialstaat und Zivilgesellschaft">Sozialstaat</button>
      <button class="pill" data-filter-topic="Geschichte">Geschichte</button>
      <button class="pill" data-filter-topic="Geografie">Geografie</button>
      <button class="pill" data-filter-topic="Kultur und Alltagskultur">Kultur</button>
    </div>
    <div class="filter-row">
      <button class="pill active" data-filter-status="">Alle</button>
      <button class="pill" data-filter-status="unseen">Noch nie</button>
      <button class="pill" data-filter-status="wrong">Zuletzt falsch</button>
      <button class="pill" data-filter-status="correct">Zuletzt richtig</button>
    </div>

    <div id="q-list" class="q-list"></div>
    <div id="modal-root"></div>
  `;

  return [html, (container) => {
    let topicFilter  = '';
    let statusFilter = '';

    function getStatus(q) {
      const p = progress[q.id];
      if (!p) return 'unseen';
      return p.last_result === 'correct' ? 'correct' : 'wrong';
    }

    function renderList() {
      let filtered = questions;
      if (topicFilter)  filtered = filtered.filter(q => q.topic === topicFilter);
      if (statusFilter) filtered = filtered.filter(q => getStatus(q) === statusFilter);

      const list = container.querySelector('#q-list');
      list.innerHTML = filtered.slice(0, 200).map(q => {
        const status = getStatus(q);
        const color  = TOPIC_COLORS[q.topic] || '';
        const badge  = status === 'correct'
          ? '<span class="badge badge-correct">✓</span>'
          : status === 'wrong'
          ? '<span class="badge badge-wrong">✗</span>'
          : '<span class="badge badge-unseen">Neu</span>';
        return `
          <div class="q-item" data-qid="${esc(q.id)}">
            <div class="q-item-text">${esc(q.text)}</div>
            <div class="q-item-meta">
              <span style="color:${color};font-weight:600;font-size:.7rem">${esc(TOPIC_SHORT[q.topic] || '')}</span>
              <span>${esc(q.subtopic || '')}</span>
              ${badge}
            </div>
          </div>
        `;
      }).join('') + (filtered.length > 200 ? `<p class="text-muted text-small text-center mt-1">+ ${filtered.length - 200} weitere</p>` : '');
    }

    function pillFilter(attr, setter) {
      container.querySelectorAll(`[${attr}]`).forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll(`[${attr}]`).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          setter(btn.dataset[attr.replace('data-','').replace('-','_')] ?? btn.getAttribute(attr));
          renderList();
        });
      });
    }

    // Wire filter pills
    container.querySelectorAll('[data-filter-topic]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-filter-topic]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        topicFilter = btn.dataset.filterTopic;
        renderList();
      });
    });
    container.querySelectorAll('[data-filter-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        statusFilter = btn.dataset.filterStatus;
        renderList();
      });
    });

    // Question detail modal
    container.addEventListener('click', e => {
      const item = e.target.closest('[data-qid]');
      if (item) {
        const q = questions.find(x => x.id === item.dataset.qid);
        if (q) openModal(q, container);
        return;
      }
      const nav = e.target.closest('[data-nav]');
      if (nav) navigate(nav.dataset.nav.replace(/^\//, ''));

      if (e.target.classList.contains('modal-backdrop')) closeModal(container);
      if (e.target.closest('.modal-close')) closeModal(container);
    });

    renderList();
  }];
}

function openModal(q, container) {
  const LETTERS = ['a', 'b', 'c', 'd'];
  container.querySelector('#modal-root').innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${esc(q.text)}</div>
          <button class="modal-close">✕</button>
        </div>
        <div class="options-list">
          ${LETTERS.map(l => `
            <div class="option-btn ${l === q.answer ? 'correct' : ''}" style="cursor:default">
              <span class="option-letter">${l}</span>
              <span>${esc(q.options[l])}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:.75rem;color:var(--muted);margin-top:.75rem">
          ${esc(q.topic)} · ${esc(q.subtopic || '')} · Seite ${q.source_page ?? '—'}
        </p>
      </div>
    </div>
  `;
}

function closeModal(container) {
  container.querySelector('#modal-root').innerHTML = '';
}
