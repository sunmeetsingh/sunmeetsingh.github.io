export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pct(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('de-CH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export const TOPIC_COLORS = {
  'Demokratie und Föderalismus':    'var(--topic-demokratie)',
  'Sozialstaat und Zivilgesellschaft': 'var(--topic-sozialstaat)',
  'Geschichte':                     'var(--topic-geschichte)',
  'Geografie':                      'var(--topic-geografie)',
  'Kultur und Alltagskultur':       'var(--topic-kultur)',
};

export const TOPIC_SHORT = {
  'Demokratie und Föderalismus':    'Demokratie',
  'Sozialstaat und Zivilgesellschaft': 'Sozialstaat',
  'Geschichte':                     'Geschichte',
  'Geografie':                      'Geografie',
  'Kultur und Alltagskultur':       'Kultur',
};
