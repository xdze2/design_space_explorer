import { buildHash } from '../hash.js';
import { outlineRows, badges } from '../outline.js';
import { render as renderNode } from './node.js';
import { el } from '../dom.js';

const MAX_DEPTH = 20;

function row(graph, r, route) {
  const { pick } = route;
  const style = `--level: ${r.level}`;
  if (r.kind === 'more') {
    const up = r.side === 'up' ? Math.min(route.up + 2, MAX_DEPTH) : route.up;
    const down = r.side === 'down' ? Math.min(route.down + 2, MAX_DEPTH) : route.down;
    const href = buildHash('graph', { pick, view: route.view, up, down });
    return el('li', { class: 'more', style }, el('a', { href }, `+${r.hidden} more`));
  }
  const node = graph.byId.get(r.id);
  const chosen = pick.includes(r.id);
  const classes = ['row', r.kind, chosen ? 'chosen' : '', r.repeat ? 'repeat' : ''].filter(Boolean).join(' ');
  const link = el('a', { href: buildHash('graph', { pick, view: r.id }) }, `${chosen ? '✓ ' : ''}${node.title}`);
  const tags = badges(graph, node).map((b) =>
    el('a', { class: `tag ${b.kind.replace(' ', '-')}`, href: buildHash('graph', { pick, view: b.id }) }, `${b.kind}: ${b.title}`));
  return el('li', { class: classes, style }, link, r.repeat ? el('small', { class: 'repeat-label' }, 'repeat') : null,
    tags.length ? el('div', { class: 'tags' }, ...tags) : null);
}

const section = (text) => el('li', { class: 'section' }, text);

// An outline around the open node (the root when none), with the open node in the main pane beside it.
export function render(graph, route) {
  const focus = route.view ?? graph.rootId;
  const rows = outlineRows(graph, focus, route);
  const items = [];
  const at = rows.findIndex((r) => r.kind === 'focus');
  if (at > 0) items.push(section('Why'));
  rows.forEach((r, i) => {
    items.push(row(graph, r, route));
    if (i === at && i < rows.length - 1) items.push(section('How'));
  });
  const outline = el('ul', { class: 'outline' }, ...items);
  const pane = route.view
    ? renderNode(graph, route)
    : el('p', { class: 'hint' }, 'Select a node in the outline to read it and choose options.');
  return el('div', { class: 'graph-page' }, el('nav', {}, outline), el('section', { class: 'pane' }, pane));
}
