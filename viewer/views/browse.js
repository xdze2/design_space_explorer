import { buildHash } from '../hash.js';
import { el } from '../dom.js';

function treeNode(graph, id, { pick }) {
  const node = graph.byId.get(id);
  const chosen = pick.includes(id);
  const a = el('a', { href: buildHash('browse', { pick, view: id }), class: chosen ? 'chosen' : '' },
    `${chosen ? '✓ ' : ''}${node.title}`);
  if (!node.children?.length) return el('li', {}, a);
  const details = el('details', { open: '' }, el('summary', {}, a));
  details.append(el('ul', {}, ...node.children.map((c) => treeNode(graph, c, { pick }))));
  return el('li', {}, details);
}

// Full-width overview: the whole graph as an expanded tree. Nodes open in the modal.
export function render(graph, { pick }) {
  const tree = el('ul', { class: 'tree' }, treeNode(graph, graph.rootId, { pick }));
  return el('div', { class: 'browse' }, el('nav', {}, tree));
}
