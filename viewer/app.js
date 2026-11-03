import { parseHash, buildHash, DEFAULT_HASH } from './hash.js';
import { render as renderGraph } from './views/graph.js';
import { render as renderDesign } from './views/design.js';
import { render as renderTray } from './views/tray.js';
import { render as renderNode } from './views/node.js';
import { el } from './dom.js';

const pages = { graph: renderGraph, design: renderDesign };
const app = document.getElementById('app');
let graph;
let closeHref = null;

function show(...nodes) {
  app.replaceChildren(...nodes);
}

async function load() {
  const res = await fetch('../graph.json');
  if (!res.ok) throw new Error(`graph.json: HTTP ${res.status}`);
  const data = await res.json().catch((e) => {
    throw new Error(`graph.json is not valid JSON (${e.message})`);
  });
  if (!Array.isArray(data?.nodes)) throw new Error('graph.json has no "nodes" array');
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const root = data.nodes.find((n) => n.type === 'root');
  if (!root) throw new Error('graph.json has no root node');
  return { nodes: data.nodes, byId, rootId: root.id };
}

function route() {
  if (!location.hash) {
    location.hash = DEFAULT_HASH;
    return;
  }
  const route = parseHash(location.hash, new Set(graph.byId.keys()));
  const { page, pick, view, unknown } = route;
  const notice = unknown.length
    ? el('p', { class: 'notice' }, `Ignored unknown node id: ${unknown.join(', ')}`)
    : '';
  // Header links keep the selection.
  document.getElementById('nav-design').href = buildHash('design', { pick });
  document.getElementById('nav-graph').href = buildHash('graph', { pick });
  const main = el('div', { class: 'main' }, notice, pages[page](graph, route));
  let layout = el('div', { class: 'layout single' }, main);
  closeHref = null;
  if (page === 'design' && view) {
    // The drawer sits beside the page, which stays rendered and clickable.
    closeHref = buildHash('design', { pick });
    const close = el('a', { class: 'close', href: closeHref, 'aria-label': 'Close' }, '×');
    const drawer = el('aside', { class: 'drawer', 'aria-label': graph.byId.get(view).title }, close, renderNode(graph, route));
    layout = el('div', { class: 'layout' }, main, drawer);
  }
  const y = scrollY;
  show(renderTray(graph, route), layout);
  scrollTo(0, y);
}

addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && closeHref) location.hash = closeHref;
});

try {
  graph = await load();
  addEventListener('hashchange', route);
  route();
} catch (e) {
  show(el('p', { class: 'error' }, `Could not load the graph: ${e.message}`));
}
