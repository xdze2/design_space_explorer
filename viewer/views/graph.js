import { buildHash } from '../hash.js';
import { visibleRows, togglePeek, toggleFold } from '../outline.js';
import { chipState, entryOf } from '../design.js';
import { el } from '../dom.js';
import { typeIcon, legend, CHIP_STATES, STATUS_MARKS } from '../icons.js';

const title = (graph, id) => graph.byId.get(id)?.title ?? id;
const names = (graph, ids) => ids.map((i) => title(graph, i)).join(', ');

function tooltip(graph, chip) {
  const base = {
    chosen: 'Chosen',
    rejected: `Rejected: ${chip.reason}`,
    excluded: `Excluded by ${names(graph, chip.cause)}`,
    required: `Required by ${names(graph, chip.cause)}`,
    shortlisted: 'Shortlisted',
    open: 'Open',
  }[chip.state];
  return chip.conflict ? `${base}. Conflict: excluded by ${names(graph, chip.cause)}` : base;
}

// Functions whose counted choice is excluded by another choice or lacks something it requires.
function problemFunctions(analysis, graph) {
  const out = new Set();
  for (const [fnId, sol] of analysis.chosen) {
    const lacks = [...analysis.required.values()].some((by) => by.includes(sol));
    if (lacks || analysis.excluded.has(sol)) out.add(fnId);
  }
  return out;
}

// Left panel: the design tree. One line per function with its solutions as chips; below a function only its chosen
// solution's sub-functions (and a peeked solution's, dormant). Every link here only opens a node or changes the view.
export function render(graph, design, analysis, route) {
  const { view, fold, peek } = route;
  const to = (over) => buildHash({ view, fold, peek, ...over });
  const rows = visibleRows(graph, design, analysis, route);
  const problems = problemFunctions(analysis, graph);
  const firstConstraint = rows.findIndex((r) => r.kind === 'constraint');

  const items = rows.map((row, index) => {
    const node = graph.byId.get(row.id);
    const classes = ['gn', row.kind, row.id === graph.rootId ? 'root' : '', row.id === view ? 'view' : '',
      row.dormant ? 'dormant' : '', row.repeat ? 'repeat' : '', row.folded ? 'folded' : '',
      index === firstConstraint ? 'first-constraint' : ''].filter(Boolean).join(' ');
    const li = el('li', { class: classes, 'data-id': row.id, style: `--depth: ${row.depth}` });

    li.append(row.foldable
      ? el('a', { class: 'fold', href: to({ fold: toggleFold(fold, row.id) }), title: row.folded ? 'Expand' : 'Collapse', 'aria-label': row.folded ? `Expand ${node.title}` : `Collapse ${node.title}` }, row.folded ? '▸' : '▾')
      : el('span', { class: 'fold-spacer' }));
    li.append(typeIcon(node.type), el('a', { class: 'name', href: to({ view: row.id }), title: `Open ${node.title}` }, node.title));

    if (row.kind === 'function' && row.solutions.length) {
      const status = entryOf(design, row.id).status;
      li.append(el('span', { class: `status ${status}`, title: `Status: ${status}`, 'aria-label': `Status: ${status}` }, STATUS_MARKS[status]));
      if (problems.has(row.id)) li.append(el('span', { class: 'conflict-mark', title: 'Problem with this choice' }, '⚠'));
    }
    if (row.repeat) li.append(el('small', { class: 'repeat-label' }, 'repeat'));
    if (row.folded) li.append(el('small', { class: 'hidden-count' }, `${row.hidden} hidden`));

    // A repeated function shows no chips: they are on its first line.
    if (row.kind === 'function' && row.solutions.length && !row.repeat) {
      li.append(el('span', { class: 'chips' }, ...row.solutions.map((solId) => {
        const sol = graph.byId.get(solId);
        const chip = chipState(analysis, design, row.id, solId);
        const { mark, text } = CHIP_STATES[chip.state];
        const tip = tooltip(graph, chip);
        const a = el('a', {
          class: `chip ${chip.state}${chip.conflict ? ' conflict' : ''}${solId === view ? ' view' : ''}`,
          href: to({ view: solId }), title: tip, 'aria-label': `${sol.title} (${text})`,
        }, typeIcon('solution'),
        mark ? el('span', { class: 'mark', 'aria-hidden': 'true' }, mark) : null,
        sol.title,
        chip.conflict ? el('span', { class: 'conflict-mark', 'aria-hidden': 'true' }, '⚠') : null);
        const peekable = chip.state !== 'chosen' && (sol.how ?? []).length > 0;
        return el('span', { class: 'chipwrap' }, a, peekable
          ? el('a', {
            class: `peek${row.peeked === solId ? ' on' : ''}`, href: to({ peek: togglePeek(graph, peek, row.id, solId) }),
            title: row.peeked === solId ? `Hide what ${sol.title} brings` : `Peek at what ${sol.title} brings`,
            'aria-label': `Peek at ${sol.title}`,
          }, row.peeked === solId ? '▾' : '▸')
          : null);
      })));
    }
    return li;
  });

  return el('div', { class: 'graph' }, el('ul', { class: 'outline' }, ...items), legend());
}
