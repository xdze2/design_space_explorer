import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { toggle } from '../select.js';
import { el } from '../dom.js';

let onKey;

function edgeList(graph, label, ids, href) {
  if (!ids?.length) return null;
  const links = ids.map((id) => {
    const a = el('a', { href: href(id) }, graph.byId.get(id)?.title ?? id);
    // Node-to-node moves replace the entry so back still closes the modal in one step.
    a.addEventListener('click', (e) => {
      e.preventDefault();
      location.replace(href(id));
    });
    return a;
  });
  return el('p', {}, `${label}: `, ...links.flatMap((a, i) => (i ? [', ', a] : [a])));
}

// Node detail layer over the current page. `route` is { page, pick, view }.
export function render(graph, { page, pick, view }) {
  const node = graph.byId.get(view);
  const at = (id) => buildHash(page, { pick, view: id });
  const body = el('div', { class: 'body' });
  body.innerHTML = renderMarkdown(node.body ?? '');
  const closeHref = buildHash(page, { pick });
  const close = el('a', { class: 'close', href: closeHref, 'aria-label': 'Close' }, '×');

  const select = node.type === 'option'
    ? el('p', {}, el('a', { class: 'button', href: buildHash(page, { pick: toggle(graph, pick, node.id), view: node.id }) },
      pick.includes(node.id) ? 'Remove from selection' : 'Select this option'))
    : null;

  const box = el('section', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': node.title },
    close,
    el('h2', {}, node.title),
    el('p', { class: 'meta' }, `${node.type} · confidence: ${node.confidence ?? 'n/a'} · `, el('code', {}, node.id)),
    select,
    body,
    edgeList(graph, 'Requires', node.requires, at),
    edgeList(graph, 'Excludes', node.excludes, at),
    edgeList(graph, 'Compatible with', node.compatible_with, at),
    el('p', { class: 'sources' }, 'Sources: ', (node.sources ?? []).join('; ') || 'none'),
  );
  const backdrop = el('div', { class: 'backdrop' }, box);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) location.hash = closeHref;
  });
  if (onKey) removeEventListener('keydown', onKey);
  onKey = (e) => {
    if (e.key === 'Escape') location.hash = closeHref;
  };
  addEventListener('keydown', onKey);
  setTimeout(() => close.focus());
  return backdrop;
}

// Called when no modal is shown, to drop the previous Esc handler.
export function dispose() {
  if (onKey) removeEventListener('keydown', onKey);
  onKey = null;
}
