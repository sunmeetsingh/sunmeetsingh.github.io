/**
 * StorageAdapter — the ONLY module that reads/writes localStorage.
 *
 * To migrate to a backend (Supabase, Firebase, etc.):
 *   1. Create storage-remote.js implementing the same exported object.
 *   2. Swap the <script> import in index.html.
 *   3. On first remote load call importAll(localAdapter.exportAll()) once.
 */

const KEYS = { progress: 'gk_progress', sessions: 'gk_sessions', meta: 'gk_meta' };

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

export const StorageAdapter = {
  getProgress(questionId) {
    return (load(KEYS.progress) || {})[questionId] || null;
  },

  recordAttempt(questionId, correct) {
    const all = load(KEYS.progress) || {};
    const prev = all[questionId] || { attempts: 0, correct: 0, streak: 0, last_result: null, last_seen: null };
    all[questionId] = {
      attempts: prev.attempts + 1,
      correct:  prev.correct + (correct ? 1 : 0),
      streak:   correct ? prev.streak + 1 : 0,
      last_result: correct ? 'correct' : 'wrong',
      last_seen: new Date().toISOString(),
    };
    save(KEYS.progress, all);

    const meta = load(KEYS.meta) || {};
    meta.total_questions_answered = (meta.total_questions_answered || 0) + 1;
    save(KEYS.meta, meta);
  },

  getAllProgress() { return load(KEYS.progress) || {}; },

  saveSession(session) {
    const sessions = load(KEYS.sessions) || [];
    sessions.unshift(session);
    save(KEYS.sessions, sessions.slice(0, 50));

    const meta = load(KEYS.meta) || {};
    meta.total_sessions = (meta.total_sessions || 0) + 1;
    if (!meta.first_use) meta.first_use = new Date().toISOString();
    meta.schema_version = '1';
    save(KEYS.meta, meta);
  },

  getSessions(limit = 10) {
    return (load(KEYS.sessions) || []).slice(0, limit);
  },

  getMeta() {
    return load(KEYS.meta) || {
      schema_version: '1', first_use: null,
      total_sessions: 0, total_questions_answered: 0,
    };
  },

  exportAll() {
    return {
      progress: load(KEYS.progress) || {},
      sessions: load(KEYS.sessions) || [],
      meta:     load(KEYS.meta)     || {},
    };
  },

  importAll(data) {
    if (data.progress) save(KEYS.progress, data.progress);
    if (data.sessions) save(KEYS.sessions, data.sessions);
    if (data.meta)     save(KEYS.meta,     data.meta);
  },

  // Stubs — replace with real implementation in storage-remote.js
  async syncToRemote()    { /* no-op */ },
  async fetchFromRemote() { /* no-op */ },
};
