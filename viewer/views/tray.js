import { analyze, undecided, toggle } from '../select.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

// Selection summary shown on every page: chips, counts, Reset. Keeps the page and the open node.
export function render(graph, { page, pick, view }) {
  const { missing, conflicts } = analyze(graph, pick);
  const problems = missing.size + conflicts.length;
  const open = undecided(graph, pick).length;

  const chips = pick.map((id) => {
    const node = graph.byId.get(id);
    return el('span', { class: 'chip' },
      el('a', { href: buildHash(page, { pick, view: id }) }, node?.title ?? id),
      el('a', { class: 'remove', href: buildHash(page, { pick: toggle(graph, pick, id), view }), 'aria-label': `Remove ${node?.title ?? id}`, title: 'Remove' }, '×'));
  });
  const summary = el('span', { class: 'counts' },
    el('span', {}, `${open} undecided`),
    ' · ',
    el('span', { class: problems ? 'problems' : '' }, `${problems} ${problems === 1 ? 'problem' : 'problems'}`));
  const reset = pick.length ? el('a', { class: 'reset', href: buildHash(page, { view }) }, 'Reset') : null;
  return el('section', { class: 'tray', 'aria-label': 'Selection' },
    el('span', { class: 'tray-label' }, 'Selection:'),
    ...(chips.length ? chips : [el('span', { class: 'empty' }, 'nothing yet')]),
    summary, reset);
}
