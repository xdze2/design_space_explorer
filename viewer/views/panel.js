import { analyze, toggle } from '../select.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

// Selection panel, shown on the Selection page. Toggling keeps the page and the open modal.
export function render(graph, { page, pick, view }) {
  const { excluded, missing, conflicts } = analyze(graph, pick);
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const viewLink = (id) => el('a', { class: 'view', href: buildHash(page, { pick, view: id }), title: 'View details', 'aria-label': `View ${title(id)}` }, 'i');
  const toggleHref = (id) => buildHash(page, { pick: toggle(graph, pick, id), view });

  const decisions = graph.nodes.filter((n) => n.type === 'decision').map((d) => {
    const options = (d.children ?? []).map((id) => {
      const on = pick.includes(id);
      const by = excluded.get(id);
      if (by && !on) {
        return el('li', { class: 'excluded' },
          el('span', { class: 'name' }, title(id)), ' ', viewLink(id),
          el('small', { class: 'reason' }, `Excluded by ${title(by)}`));
      }
      return el('li', { class: on ? 'chosen' : '' }, el('a', { href: toggleHref(id) }, `${on ? '✓ ' : ''}${title(id)}`), ' ', viewLink(id));
    });
    return el('section', {}, el('h3', {}, d.title), el('ul', { class: 'options' }, ...options));
  });

  const problems = missing.size + conflicts.length;
  const head = el('h2', {}, `Selection (${pick.length})`);
  if (problems) head.append(' ', el('a', { class: 'badge', href: buildHash('selection', { pick }) }, `${problems} to fix`));
  if (pick.length) head.append(' ', el('a', { class: 'reset', href: buildHash(page, { view }) }, 'Reset'));
  return el('aside', { class: 'panel' }, head, ...decisions);
}
