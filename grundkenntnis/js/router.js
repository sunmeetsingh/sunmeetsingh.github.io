const routes = {};
let notFoundHandler = null;

export function register(pattern, handler) {
  routes[pattern] = handler;
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  window.location.hash = '/' + path.replace(/^\//, '');
}

function currentPath() {
  return '/' + window.location.hash.replace(/^#\/?/, '');
}

function dispatch() {
  const path = currentPath();

  // Exact match
  if (routes[path]) { routes[path]({}); return; }

  // Pattern match (e.g. /handbook/:sectionId)
  for (const [pattern, handler] of Object.entries(routes)) {
    const paramNames = [];
    const regex = new RegExp(
      '^' + pattern.replace(/:([a-z]+)/g, (_, n) => { paramNames.push(n); return '([^/]+)'; }) + '$'
    );
    const m = path.match(regex);
    if (m) {
      const params = Object.fromEntries(paramNames.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
      handler(params);
      return;
    }
  }

  if (notFoundHandler) notFoundHandler({});
}

export function init() {
  window.addEventListener('hashchange', dispatch);
  dispatch(); // run once on load
}
