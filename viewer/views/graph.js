import { buildHash } from '../hash.js';
import { analyze, undecided, toggle } from '../select.js';
import { outlineRows, crossLinks } from '../outline.js';
import { el, svg } from '../dom.js';

const ROW = 30; // px, every row has the same height so link ends are plain arithmetic
const LINKS = 56; // px, width of the link lane

function selectionState(graph, pick) {
  const { excluded, missing, conflicts } = analyze(graph, pick);
  return {
    excluded, missing,
    open: new Set(undecided(graph, pick).map((d) => d.id)),
    inConflict: new Set(conflicts.flat()),
  };
}

const title = (graph, id) => graph.byId.get(id)?.title ?? id;

// State tags of a node, in a fixed order.
function tagsOf(graph, state, pick, id) {
  const tags = [];
  if (pick.includes(id)) tags.push(['chosen', 'chosen']);
  const by = state.excluded.get(id);
  if (by && !pick.includes(id)) tags.push(['excluded', `excluded by ${title(graph, by)}`]);
  if (state.open.has(id)) tags.push(['undecided', 'undecided']);
  const needs = [...state.missing].filter(([, by]) => by.includes(id)).map(([m]) => title(graph, m));
  if (needs.length) tags.push(['needs', `needs ${needs.join(', ')}`]);
  if (state.missing.has(id)) tags.push(['needs', `needed by ${state.missing.get(id).map((r) => title(graph, r)).join(', ')}`]);
  if (state.inConflict.has(id)) tags.push(['conflict', 'conflict']);
  return tags;
}

// Left panel: the whole graph as an indented outline, one fixed-height line per node. Right of the names, three aligned
// lanes: state tags, links (one SVG over all rows) and the (?) button.
// An option's name toggles it; any other node's name opens it.
export function render(graph, { pick, view }) {
  const state = selectionState(graph, pick);
  const rows = outlineRows(graph);
  const rowOf = new Map();
  rows.forEach((r, i) => { if (!rowOf.has(r.id)) rowOf.set(r.id, i); });

  const items = rows.map(({ id, depth, repeat }) => {
    const node = graph.byId.get(id);
    const chosen = pick.includes(id);
    const by = state.excluded.get(id);
    const blocked = node.type === 'option' && by && !chosen;
    const toggles = node.type === 'option' && !blocked;
    const classes = ['gn', node.type, id === view ? 'view' : '', chosen ? 'chosen' : '', blocked ? 'excluded' : '',
      state.open.has(id) ? 'undecided' : '', state.inConflict.has(id) ? 'conflict' : '',
      state.missing.has(id) || [...state.missing.values()].some((r) => r.includes(id)) ? 'needed' : '',
      repeat ? 'repeat' : ''].filter(Boolean).join(' ');
    const label = blocked ? `Excluded by ${title(graph, by)}`
      : toggles ? (chosen ? 'Remove from selection' : 'Select this option') : `Open ${node.title}`;
    const href = toggles ? buildHash({ pick: toggle(graph, pick, id), view }) : buildHash({ pick, view: id });
    const name = blocked ? el('span', { class: 'name', title: label }, node.title) : el('a', { class: 'name', href, title: label }, node.title);
    const tags = tagsOf(graph, state, pick, id).map(([kind, text]) => el('span', { class: `tag ${kind}`, title: text }, text));
    return el('li', { class: classes, 'data-id': id, style: `--depth: ${depth}` },
      el('span', { class: 'dot' }), name, repeat ? el('small', { class: 'repeat-label' }, 'repeat') : null,
      el('span', { class: 'tags' }, ...tags),
      el('span', { class: 'lane' }),
      el('a', { class: 'help', href: buildHash({ pick, view: id }), title: `About ${node.title}`, 'aria-label': `About ${node.title}` }, '?'));
  });

  // Link lane: each link joins the first rows of its two nodes with a curve; farther rows bend deeper into the lane.
  const height = rows.length * ROW;
  const lane = svg('svg', { class: 'links', width: LINKS, height, viewBox: `0 0 ${LINKS} ${height}`, 'aria-hidden': 'true' },
    svg('defs', {}, svg('marker', { id: 'arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' },
      svg('path', { d: 'M0 0 L8 4 L0 8 z', class: 'arrow' }))));
  const y = (id) => rowOf.get(id) * ROW + ROW / 2;
  for (const { from, to, type } of crossLinks(graph)) {
    if (!rowOf.has(from) || !rowOf.has(to)) continue;
    const x = 4;
    const bend = Math.min(LINKS - 12, 8 + Math.abs(y(from) - y(to)) / 8);
    lane.append(svg('path', {
      class: `cross ${type}${from === view || to === view ? ' hot' : ''}`, 'data-ends': `${from} ${to}`,
      d: `M${x} ${y(from)} C${x + bend} ${y(from)} ${x + bend} ${y(to)} ${x} ${y(to)}`,
      'marker-end': type === 'requires' ? 'url(#arrow)' : '',
    }));
  }

  const list = el('ul', { class: 'outline', style: `--row: ${ROW}px; --links: ${LINKS}px` }, ...items, lane);
  // Hovering a row lights its links.
  list.addEventListener('mouseover', (e) => {
    const id = e.target.closest('.gn')?.dataset.id;
    for (const p of lane.querySelectorAll('.cross')) p.classList.toggle('hover', !!id && p.dataset.ends.split(' ').includes(id));
  });
  list.addEventListener('mouseleave', () => {
    for (const p of lane.querySelectorAll('.cross.hover')) p.classList.remove('hover');
  });
  return list;
}
