// Selection = array of node ids, at most one option per decision (same parent).
export function toggle(graph, selection, id) {
  if (selection.includes(id)) return selection.filter((s) => s !== id);
  const parent = graph.byId.get(id)?.parent;
  return [...selection.filter((s) => graph.byId.get(s)?.parent !== parent), id];
}

// Direct edges only. `excluded`: id -> selected node responsible (first one).
export function analyze(graph, selection) {
  const chosen = new Set(selection);
  const excluded = new Map();
  const missing = new Map(); // id -> selected nodes requiring it
  const conflicts = [];
  for (const id of selection) {
    const node = graph.byId.get(id);
    for (const ex of node?.excludes ?? []) {
      if (!excluded.has(ex)) excluded.set(ex, id);
      if (chosen.has(ex) && id < ex) conflicts.push([id, ex]);
    }
    for (const req of node?.requires ?? []) {
      if (!chosen.has(req)) missing.set(req, [...(missing.get(req) ?? []), id]);
    }
  }
  return { excluded, missing, conflicts };
}
