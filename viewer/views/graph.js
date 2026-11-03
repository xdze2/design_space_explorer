import { buildHash } from '../hash.js';
import { render as renderNode } from './node.js';
import { el } from '../dom.js';

function treeNode(graph, id, { pick, view }) {
  const node = graph.byId.get(id);
  const chosen = pick.includes(id);
  const a = el('a', { href: buildHash('graph', { pick, view: id }), class: `${chosen ? 'chosen' : ''}${id === view ? ' current' : ''}` },
    `${chosen ? '✓ ' : ''}${node.title}`);
  if (!node.children?.length) return el('li', {}, a);
  const details = el('details', { open: '' }, el('summary', {}, a));
  details.append(el('ul', {}, ...node.children.map((c) => treeNode(graph, c, { pick, view }))));
  return el('li', {}, details);
}

// The whole graph as an expanded tree, with the open node in the main pane beside it.
export function render(graph, route) {
  const tree = el('ul', { class: 'tree' }, treeNode(graph, graph.rootId, route));
  const pane = route.view
    ? renderNode(graph, route)
    : el('p', { class: 'hint' }, 'Select a node in the tree to read it and choose options.');
  return el('div', { class: 'graph-page' }, el('nav', {}, tree), el('section', { class: 'pane' }, pane));
}
