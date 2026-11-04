// Preorder walk of the how links from the root: one row per node, { id, depth, repeat }, then the constraint nodes as plain rows.
// A node reached again through another why is listed again, marked as a repeat, and its how nodes are not listed again.
export function outlineRows(graph) {
  const rows = [];
  const seen = new Set();
  const visit = (id, depth) => {
    const repeat = seen.has(id);
    rows.push({ id, depth, repeat });
    if (repeat) return;
    seen.add(id);
    for (const c of graph.byId.get(id).how ?? []) if (graph.byId.has(c)) visit(c, depth + 1);
  };
  visit(graph.rootId, 0);
  for (const n of graph.nodes) if (n.type === 'constraint') rows.push({ id: n.id, depth: 0, repeat: false });
  return rows;
}

// Links between nodes: { from, to, type }. `requires` has a direction; `excludes` and `compatible_with` are listed once per pair.
export function crossLinks(graph) {
  const links = [];
  const seen = new Set();
  for (const n of graph.nodes) {
    for (const type of ['requires', 'excludes', 'compatible_with']) {
      for (const to of n[type] ?? []) {
        if (!graph.byId.has(to)) continue;
        const key = type === 'requires' ? `${type}|${n.id}|${to}` : `${type}|${[n.id, to].sort().join('|')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ from: n.id, to, type });
      }
    }
  }
  return links;
}
