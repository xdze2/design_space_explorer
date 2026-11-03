import { parseHash, DEFAULT_HASH } from './hash.js';
import { render as renderBrowse } from './views/browse.js';
import { render as renderSelect } from './views/select.js';
import { el } from './dom.js';

const views = { browse: renderBrowse, select: renderSelect };
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
  const { view, params, unknown } = parseHash(location.hash, new Set(graph.byId.keys()));
  const notice = unknown.length
    ? el('p', { class: 'notice' }, `Ignored unknown node id: ${unknown.join(', ')}`)
    : '';
  show(notice, views[view](graph, params));
}

try {
  graph = await load();
  addEventListener('hashchange', route);
  route();
} catch (e) {
  show(el('p', { class: 'error' }, `Could not load the graph: ${e.message}`));
}
