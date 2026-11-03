export const DEFAULT_UP = 3;
export const DEFAULT_DOWN = 2;

const parentsOf = (node) => node.parents ?? (node.parent ? [node.parent] : []);
const childrenOf = (node) => node.children ?? [];

// Number of distinct nodes reachable from `id` through `next`, `id` excluded.
function reachable(graph, id, next) {
  const seen = new Set();
  const walk = (n) => {
    for (const r of next(graph.byId.get(n))) {
      if (seen.has(r)) continue;
      seen.add(r);
      walk(r);
    }
  };
  walk(id);
  seen.delete(id);
  return seen.size;
}

// Preorder walk from `id` along `next`, `limit` levels deep. Rows are { id, kind, level, repeat, hidden, side }.
function walk(graph, id, next, kind, limit) {
  const rows = [];
  const seen = new Set([id]);
  const visit = (n, level) => {
    const repeat = level > 0 && seen.has(n);
    if (level > 0) rows.push({ id: n, kind, level, repeat });
    if (repeat) return;
    seen.add(n);
    const rels = next(graph.byId.get(n));
    if (level < limit) {
      for (const r of rels) visit(r, level + 1);
    } else if (rels.length) {
      rows.push({ kind: 'more', side: kind, level: level + 1, hidden: reachable(graph, n, next) });
    }
  };
  visit(id, 0);
  return rows;
}

// The outline around `focusId`: ancestors mirrored above, the focus, descendants below.
export function outlineRows(graph, focusId, { up = DEFAULT_UP, down = DEFAULT_DOWN } = {}) {
  const above = walk(graph, focusId, parentsOf, 'up', up).reverse();
  const below = walk(graph, focusId, childrenOf, 'down', down);
  return [...above, { id: focusId, kind: 'focus', level: 0, repeat: false }, ...below];
}

const KINDS = [['requires', 'requires'], ['excludes', 'excludes'], ['compatible_with', 'compatible with']];

// Link badges of a node, in a fixed order: [{ kind, id, title }].
export function badges(graph, node) {
  return KINDS.flatMap(([field, kind]) =>
    (node[field] ?? []).map((id) => ({ kind, id, title: graph.byId.get(id)?.title ?? id })));
}
