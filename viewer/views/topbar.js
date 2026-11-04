import { analyze, undecided } from '../select.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

// Compact selection summary: decisions grouped by slot, each a pill with its chosen option (or "?").
export function render(graph, { pick, view }) {
  const { missing, conflicts } = analyze(graph, pick);
  const problems = missing.size + conflicts.length;
  const open = undecided(graph, pick).length;
  const inConflict = new Set(conflicts.flat().map((id) => graph.byId.get(id).parent));
  const needing = new Set([...missing.values()].flat().map((id) => graph.byId.get(id).parent));

  const slots = new Map();
  for (const d of graph.nodes.filter((n) => n.type === 'decision')) {
    const name = d.slot ?? 'Other';
    slots.set(name, [...(slots.get(name) ?? []), d]);
  }
  const groups = [...slots].map(([name, decisions]) =>
    el('span', { class: 'slot' },
      el('span', { class: 'slot-name' }, name),
      ...decisions.map((d) => {
        const choice = (d.children ?? []).find((c) => pick.includes(c));
        const state = [choice ? 'decided' : 'open', inConflict.has(d.id) ? 'conflict' : '', needing.has(d.id) ? 'needed' : '',
          d.id === view ? 'view' : ''].filter(Boolean).join(' ');
        return el('a', { class: `pill ${state}`, href: buildHash({ pick, view: d.id }) },
          el('span', { class: 'pill-label' }, d.title), choice ? graph.byId.get(choice).title : '?');
      })));

  return [
    el('a', { class: 'home', href: buildHash({ pick }) }, 'Design space explorer'),
    el('div', { class: 'slots', 'aria-label': 'Selection' }, ...groups),
    el('span', { class: 'counts' },
      `${pick.length} picked · ${open} undecided · `,
      el('span', { class: problems ? 'problems' : '' }, `${problems} ${problems === 1 ? 'problem' : 'problems'}`)),
    pick.length ? el('a', { class: 'reset', href: buildHash({ view }) }, 'Reset') : null,
  ];
}
