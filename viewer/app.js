import { parseHash, buildHash, DEFAULT_HASH } from './hash.js';
import { render as renderBrowse } from './views/browse.js';
import { render as renderSelection } from './views/selection.js';
import { render as renderPanel } from './views/panel.js';
import { render as renderModal, dispose as disposeModal } from './views/modal.js';
import { el } from './dom.js';

const pages = { browse: renderBrowse, selection: renderSelection };
const app = document.getElementById('app');
let graph;

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
  document.getElementById('nav-selection').href = buildHash('selection', { pick });
  document.getElementById('nav-browse').href = buildHash('browse', { pick });
  const main = el('div', { class: 'main' }, notice, pages[page](graph, route));
  const layout = page === 'selection'
    ? el('div', { class: 'layout' }, renderPanel(graph, route), main)
    : el('div', { class: 'layout single' }, main);
  const y = scrollY;
  show(layout);
  if (view) app.append(renderModal(graph, route));
  else disposeModal();
  scrollTo(0, y);
}

try {
  graph = await load();
  addEventListener('hashchange', route);
  route();
} catch (e) {
  show(el('p', { class: 'error' }, `Could not load the graph: ${e.message}`));
}
