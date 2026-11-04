import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { analyze, toggle } from '../select.js';
import { el } from '../dom.js';
import { typeIcon } from '../icons.js';

function edgeList(graph, label, ids, href) {
  if (!ids?.length) return null;
  const links = ids.map((id) => {
    const a = el('a', { href: href(id) }, graph.byId.get(id)?.title ?? id);
    // Node-to-node moves replace the entry so back leaves the node in one step.
    a.addEventListener('click', (e) => {
      e.preventDefault();
      location.replace(href(id));
    });
    return a;
  });
  return el('p', {}, `${label}: `, ...links.flatMap((a, i) => (i ? [', ', a] : [a])));
}

// Node detail, shown in the modal. `route` is { pick, view }.
export function render(graph, { pick, view }) {
  const node = graph.byId.get(view);
  const at = (id) => buildHash({ pick, view: id });
  const choose = (id) => buildHash({ pick: toggle(graph, pick, id), view });
  const body = el('div', { class: 'body' });
  body.innerHTML = renderMarkdown(node.body ?? '');

  const action = node.type === 'solution'
    ? el('p', {}, el('a', { class: 'button', href: choose(node.id) },
      pick.includes(node.id) ? 'Remove from selection' : 'Select this solution'))
    : null;

  let options = null;
  const solutions = (node.how ?? []).filter((id) => graph.byId.get(id)?.type === 'solution');
  if (node.type === 'function' && solutions.length) {
    const { excluded } = analyze(graph, pick);
    const title = (id) => graph.byId.get(id)?.title ?? id;
    options = el('ul', { class: 'options' }, ...solutions.map((id) => {
      const on = pick.includes(id);
      const by = excluded.get(id);
      if (by && !on) {
        return el('li', { class: 'excluded' },
          el('span', { class: 'name' }, title(id)),
          el('small', { class: 'reason' }, `Excluded by ${title(by)}`));
      }
      return el('li', { class: on ? 'chosen' : '' },
        el('a', { href: at(id) }, title(id)), ' ',
        el('a', { class: 'button', href: choose(id) }, on ? 'Remove' : 'Choose'));
    }));
  }

  return el('div', { class: 'node' },
    el('h2', {}, typeIcon(node.type), node.title),
    el('p', { class: 'meta' }, `${node.type} · confidence: ${node.confidence ?? 'n/a'} · `, el('code', {}, node.id)),
    action,
    body,
    options ? el('h3', {}, 'Solutions') : null,
    options,
    edgeList(graph, 'Why (answers)', node.why, at),
    edgeList(graph, 'How', node.how, at),
    edgeList(graph, 'Constrains', node.constrains, at),
    edgeList(graph, 'Constrained by', node.constrained_by, at),
    edgeList(graph, 'Requires', node.requires, at),
    edgeList(graph, 'Excludes', node.excludes, at),
    edgeList(graph, 'Compatible with', node.compatible_with, at),
    el('p', { class: 'sources' }, 'Sources: ', (node.sources ?? []).join('; ') || 'none'),
  );
}
