import { shuffle } from './utils.js';
import { StorageAdapter } from './storage.js';

const SESSION_KEY = 'gk_active_session';

let _session = null;

export function startSession(allQuestions, config) {
  // config: { topicFilter, subtopicFilter, count, mode, wrongIds }
  let pool = allQuestions;

  if (config.wrongIds?.length) {
    const ids = new Set(config.wrongIds);
    pool = allQuestions.filter(q => ids.has(q.id));
  } else {
    if (config.topicFilter)    pool = pool.filter(q => q.topic === config.topicFilter);
    if (config.subtopicFilter) pool = pool.filter(q => q.subtopic === config.subtopicFilter);
  }

  pool = shuffle(pool);
  const count = config.count === 'all' ? pool.length : Math.min(Number(config.count), pool.length);

  _session = {
    id: `sess_${Date.now()}`,
    started_at: new Date().toISOString(),
    config,
    questionIds: pool.slice(0, count).map(q => q.id),
    cursor: 0,       // index of current question in questionIds
    answers: {},     // { [questionId]: { selected, correct } }
    completed: false,
  };

  _persist();
  return _session;
}

export function getSession() {
  if (_session) return _session;
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) { _session = JSON.parse(saved); }
  return _session;
}

export function clearSession() {
  _session = null;
  sessionStorage.removeItem(SESSION_KEY);
}

export function recordAnswer(questionId, selected, correct) {
  if (!_session) return;
  _session.answers[questionId] = { selected, correct };
  StorageAdapter.recordAttempt(questionId, correct);
  _persist();
}

export function advance() {
  if (!_session) return;
  _session.cursor += 1;
  _persist();
}

export function finalize() {
  if (!_session) return;
  _session.completed = true;
  _session.ended_at = new Date().toISOString();

  const ids = _session.questionIds;
  const wrongIds = ids.filter(id => _session.answers[id] && !_session.answers[id].correct);
  const correctCount = ids.filter(id => _session.answers[id]?.correct).length;

  StorageAdapter.saveSession({
    id: _session.id,
    started_at: _session.started_at,
    ended_at:   _session.ended_at,
    topic_filter:    _session.config.topicFilter    || null,
    subtopic_filter: _session.config.subtopicFilter || null,
    total:   ids.length,
    correct: correctCount,
    question_ids: ids,
    wrong_ids:    wrongIds,
  });

  const snap = { ..._session };
  clearSession();
  return snap;
}

function _persist() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(_session));
}
