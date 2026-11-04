import { parseHash, buildHash } from './hash.js';
import { analyzeDesign } from './design.js';
import { createStore } from './store.js';
import { render as renderGraph } from './views/graph.js';
import { render as renderOverview } from './views/overview.js';
import { render as renderNode } from './views/node.js';
import { el } from './dom.js';

const $ = (id) => document.getElementById(id);
const graphPanel = $('graph-panel');
const nodePanel = $('node-panel');
let graph;
let store;
let route = null;
let shownView;

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

// localStorage can throw on access (blocked site data), so even looking at it is guarded.
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Replace a panel's content; scroll to the top, or keep the position.
function fill(panel, nodes, { top = false } = {}) {
  const scroll = top ? 0 : panel.scrollTop;
  panel.replaceChildren(...nodes.filter((n) => n != null && n !== false && n !== ''));
  panel.scrollTop = scroll;
}

function notices() {
  const out = [];
  if (route.unknown.length) out.push(el('p', { class: 'notice' }, `Ignored unknown node id: ${route.unknown.join(', ')}`));
  if (route.pickIgnored) out.push(el('p', { class: 'notice' }, 'This link has a "pick" list, which is no longer read: choices now live in your design, in this browser. Open a node and choose there.'));
  store.notices.forEach(({ kind, text }) => out.push(el('p', { class: kind === 'error' ? 'error' : 'notice' }, text)));
  if (store.notices.length) {
    const dismiss = el('button', { type: 'button', class: 'dismiss' }, 'Dismiss messages');
    dismiss.addEventListener('click', () => store.dismissNotices());
    out.push(dismiss);
  }
  return out;
}

function render() {
  const analysis = analyzeDesign(graph, store.design);
  const body = route.view ? renderNode(graph, store, analysis, route) : renderOverview(graph, store, analysis, route);
  fill(graphPanel, [renderGraph(graph, store.design, analysis, route)]);
  // The node panel starts at the top for a new node and keeps its place otherwise (graph panel: always kept).
  fill(nodePanel, [...notices(), body], { top: route.view !== shownView });
  shownView = route.view;
  document.body.classList.toggle('node-open', !!route.view);
}

function onHash() {
  route = parseHash(location.hash, new Set(graph.byId.keys()));
  render();
}

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !route?.view || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  location.hash = buildHash({ ...route, view: null });
});

try {
  graph = await load();
  store = createStore(graph, { storage: browserStorage() });
  // Text fields commit on change; redrawing then could swallow the click that caused the blur, so only refresh Undo.
  store.subscribe(({ quiet }) => {
    if (!quiet) return render();
    document.querySelectorAll('.undo-btn').forEach((b) => { b.disabled = !store.canUndo; });
  });
  addEventListener('hashchange', onHash);
  onHash();
} catch (e) {
  fill(nodePanel, [el('p', { class: 'error' }, `Could not load the graph: ${e.message}`)]);
}
