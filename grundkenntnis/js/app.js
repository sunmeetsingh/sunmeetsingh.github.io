import { init as initRouter, register, setNotFound, navigate } from './router.js';
import { renderHome }        from './views/home.js';
import { renderQuizConfig }  from './views/quiz-config.js';
import { renderQuizPlayer }  from './views/quiz-player.js';
import { renderQuizResult }  from './views/quiz-result.js';
import { renderReview }      from './views/review.js';
import { renderHandbook }    from './views/handbook.js';
import { renderStats }       from './views/stats.js';

let questions = [];
let handbook  = [];

const appEl = document.getElementById('app');

function mount(result) {
  const [html, afterRender] = Array.isArray(result) ? result : [result, null];
  if (html !== undefined) appEl.innerHTML = html;
  window.scrollTo(0, 0);
  if (afterRender) afterRender(appEl);
}

async function loadData() {
  const cacheKey = 'gk_data_v1';
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { q, h } = JSON.parse(cached);
    questions = q;
    handbook  = h;
    return;
  }

  const [qRes, hRes] = await Promise.all([
    fetch('./data/questions.json'),
    fetch('./data/handbook.json'),
  ]);
  if (!qRes.ok) throw new Error(`questions.json: ${qRes.status}`);
  if (!hRes.ok) throw new Error(`handbook.json: ${hRes.status}`);

  const [qData, hData] = await Promise.all([qRes.json(), hRes.json()]);
  questions = qData.questions;
  handbook  = hData.sections;

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ q: questions, h: handbook }));
  } catch { /* quota exceeded, skip */ }
}

async function main() {
  appEl.innerHTML = '<div class="loading">Lade…</div>';

  try {
    await loadData();

    register('/',                () => mount(renderHome(questions)));
    register('/quiz',            () => mount(renderQuizConfig(questions)));
    register('/quiz/play',       () => mount(renderQuizPlayer(questions, handbook)));
    register('/quiz/result',     () => mount(renderQuizResult(questions)));
    register('/review',          () => mount(renderReview(questions)));
    register('/handbook',        () => mount(renderHandbook(handbook)));
    register('/handbook/:id',    ({ id }) => mount(renderHandbook(handbook, id)));
    register('/stats',           () => mount(renderStats(questions)));
    setNotFound(                 () => navigate('/'));

    initRouter();
  } catch (e) {
    appEl.innerHTML = `<div class="error">Fehler beim Laden der Daten: ${e.message}</div>`;
    console.error(e);
  }
}

main();
