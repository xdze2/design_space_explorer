import { analyze, toggle } from '../select.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

export function render(graph, { pick }) {
  const { excluded, missing, conflicts } = analyze(graph, pick);
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const pickLink = (id, text) => el('a', { href: buildHash('select', { pick: toggle(graph, pick, id) }) }, text);

  const decisions = graph.nodes.filter((n) => n.type === 'decision').map((d) => {
    const options = (d.children ?? []).map((id) => {
      const on = pick.includes(id);
      const by = excluded.get(id);
      if (by && !on) {
        return el('li', { class: 'excluded' }, `${title(id)} — excluded by ${title(by)}`);
      }
      const li = el('li', { class: on ? 'chosen' : '' }, pickLink(id, `${on ? '✓ ' : ''}${title(id)}`));
      if (on && by) li.append(' (excluded by a selected option)');
      return li;
    });
    return el('section', {}, el('h3', {}, d.title), el('ul', { class: 'options' }, ...options));
  });

  const panel = el('aside', { class: 'consequences' }, el('h3', {}, 'Selection'));
  if (!pick.length) panel.append(el('p', {}, 'Nothing selected yet.'));
  if (conflicts.length) {
    panel.append(
      el('h4', {}, 'Conflicts'),
      el('ul', { class: 'conflicts' }, ...conflicts.map(([a, b]) => el('li', {}, `${title(a)} excludes ${title(b)}`))),
    );
  }
  if (missing.size) {
    panel.append(
      el('h4', {}, 'Required, not selected'),
      el('ul', { class: 'missing' }, ...[...missing].map(([id, by]) =>
        el('li', {}, pickLink(id, `Select ${title(id)}`), ` (required by ${by.map(title).join(', ')})`))),
    );
  }
  return el('div', { class: 'select' }, el('div', {}, ...decisions), panel);
}
