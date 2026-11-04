import { parseHash, buildHash, DEFAULT_HASH } from './hash.js';
import { render as renderGraph } from './views/graph.js';
import { render as renderMain } from './views/main.js';
import { render as renderNode } from './views/node.js';
import { el } from './dom.js';

const $ = (id) => document.getElementById(id);
const graphPanel = $('graph-panel');
const mainPanel = $('main-panel');
const modal = $('modal');
let graph;
let closeHref = null;
let current;

async function load() {
  const res = await fetch('../graph.json');
  if (!res.ok) throw new Error(`graph.json: HTTP ${res.status}`);
  const data = await res.json().catch((e) => {
    throw new Error(`graph.json is not valid JSON (${e.message})`);
  });
  if (!Array.isArray(data?.nodes)) throw new Error('graph.json has no "nodes" array');
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  if (!byId.has(data.root)) throw new Error('graph.json has no valid "root" id');
  return { nodes: data.nodes, byId, rootId: data.root };
}

// Replace a panel's content, keeping its scroll position.
function fill(panel, ...nodes) {
  const top = panel.scrollTop;
  panel.replaceChildren(...nodes.filter((n) => n != null && n !== false && n !== ""));
  panel.scrollTop = top;
}

function route() {
  if (!location.hash) {
    location.hash = DEFAULT_HASH;
    return;
  }
  current = parseHash(location.hash, new Set(graph.byId.keys()));
  const { pick, view, unknown } = current;
  const notice = unknown.length
    ? el('p', { class: 'notice' }, `Ignored unknown node id: ${unknown.join(', ')}`)
    : '';
  fill(graphPanel, renderGraph(graph, current));
  fill(mainPanel, notice, renderMain(graph, current));

  // The node sits in a modal over the page, which stays rendered underneath.
  if (view) {
    closeHref = buildHash({ pick });
    const close = el('a', { class: 'close', href: closeHref, 'aria-label': 'Close' }, '×');
    const dialog = el('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': graph.byId.get(view).title },
      close, renderNode(graph, current));
    const scrim = el('div', { class: 'scrim' }, dialog);
    scrim.addEventListener('click', (e) => {
      if (e.target === scrim) location.hash = closeHref;
    });
    modal.replaceChildren(scrim);
    modal.hidden = false;
  } else {
    closeHref = null;
    modal.replaceChildren();
    modal.hidden = true;
  }
}

addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && closeHref) location.hash = closeHref;
});

try {
  graph = await load();
  addEventListener('hashchange', route);
  route();
} catch (e) {
  fill(mainPanel, el('p', { class: 'error' }, `Could not load the graph: ${e.message}`));
}
