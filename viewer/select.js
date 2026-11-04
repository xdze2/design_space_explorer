// A decision is a function whose how targets are solutions: the user picks one of them.
export function decisions(graph) {
  return graph.nodes.filter((n) => n.type === 'function' && (n.how ?? []).some((h) => graph.byId.get(h)?.type === 'solution'));
}

// Selection = array of node ids (solutions), at most one per decision (same why).
export function toggle(graph, selection, id) {
  if (selection.includes(id)) return selection.filter((s) => s !== id);
  const whys = graph.byId.get(id)?.why ?? [];
  const sameDecision = (s) => (graph.byId.get(s)?.why ?? []).some((w) => whys.includes(w));
  return [...selection.filter((s) => !sameDecision(s)), id];
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

// Decisions with no selected solution among their how targets.
export function undecided(graph, selection) {
  const chosen = new Set(selection);
  return decisions(graph).filter((n) => !n.how.some((c) => chosen.has(c)));
}
