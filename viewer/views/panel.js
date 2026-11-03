import { analyze, toggle } from '../select.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';

// Selection panel, shown on every page. `route` is { page, params } of the main content,
// so that toggling an option keeps the page and only changes the selection.
export function render(graph, route, pick) {
  const { excluded, missing, conflicts } = analyze(graph, pick);
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const toggleHref = (id) => buildHash(route.page, route.params, toggle(graph, pick, id));

  const decisions = graph.nodes.filter((n) => n.type === 'decision').map((d) => {
    const options = (d.children ?? []).map((id) => {
      const on = pick.includes(id);
      const by = excluded.get(id);
      if (by && !on) {
        return el('li', { class: 'excluded' },
          el('span', { class: 'name' }, title(id)),
          el('small', { class: 'reason' }, `Excluded by ${title(by)}`));
      }
      return el('li', { class: on ? 'chosen' : '' }, el('a', { href: toggleHref(id) }, `${on ? '✓ ' : ''}${title(id)}`));
    });
    return el('section', {}, el('h3', {}, d.title), el('ul', { class: 'options' }, ...options));
  });

  const problems = missing.size + conflicts.length;
  const head = el('h2', {}, el('a', { href: buildHash('selection', {}, pick) }, 'Selection'), ` (${pick.length})`);
  if (problems) head.append(' ', el('a', { class: 'badge', href: buildHash('selection', {}, pick) }, `${problems} to fix`));
  return el('aside', { class: 'panel' }, head, ...decisions);
}
