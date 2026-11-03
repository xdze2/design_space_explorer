import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

const link = (graph, id) =>
  el('a', { href: buildHash('browse', { id }) }, graph.byId.get(id)?.title ?? id);

function treeNode(graph, id, open, selected) {
  const node = graph.byId.get(id);
  const a = el('a', { href: buildHash('browse', { id }), class: id === selected ? 'sel' : '' }, node.title);
  if (!node.children?.length) return el('li', {}, a);
  const details = el('details', {}, el('summary', {}, a));
  if (open.has(id)) details.open = true;
  details.append(el('ul', {}, ...node.children.map((c) => treeNode(graph, c, open, selected))));
  return el('li', {}, details);
}

function edgeList(graph, label, ids) {
  if (!ids?.length) return null;
  return el('p', {}, `${label}: `, ...ids.flatMap((id, i) => (i ? [', ', link(graph, id)] : [link(graph, id)])));
}

function detail(graph, node) {
  const body = el('div', { class: 'body' });
  body.innerHTML = renderMarkdown(node.body ?? '');
  return el(
    'section',
    { class: 'detail' },
    el('h2', {}, node.title),
    el('p', { class: 'meta' }, `${node.type} · confidence: ${node.confidence ?? 'n/a'} · `, el('code', {}, node.id)),
    body,
    edgeList(graph, 'Requires', node.requires),
    edgeList(graph, 'Excludes', node.excludes),
    edgeList(graph, 'Compatible with', node.compatible_with),
    el('p', { class: 'sources' }, 'Sources: ', (node.sources ?? []).join('; ') || 'none'),
  );
}

export function render(graph, { id }) {
  // Expand every ancestor of the selected node (and the node itself) so it is visible.
  const open = new Set();
  for (let n = graph.byId.get(id); n; n = graph.byId.get(n.parent)) open.add(n.id);
  const root = graph.byId.get(graph.rootId);
  const tree = el('ul', { class: 'tree' }, treeNode(graph, root.id, open, id));
  return el('div', { class: 'browse' }, el('nav', {}, tree), detail(graph, graph.byId.get(id)));
}
