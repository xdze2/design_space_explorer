import { solutionsOf, entryOf, whyPath } from './design.js';

// The graph panel's lines. Preorder from the root, one row per function / component, then the constraint nodes.
// A function that offers solutions lists, below it, the how targets of its chosen solution and of its peeked one (dormant).
// Row: { id, depth, kind: 'function'|'component'|'constraint', dormant, repeat, foldable, folded, hidden,
//        solutions, peeked }   (`solutions` and `peeked` on function rows only; `hidden` = lines under a folded row)
// route = { fold: [ids], peek: [solution ids], view: id|null }. The path to the open node is shown even through folded
// lines and unpeeked solutions, without changing `fold` / `peek`.
export function visibleRows(graph, design, analysis, { fold = [], peek = [], view = null } = {}) {
  const forced = new Set(view ? whyPath(graph, analysis, view) : []);
  const folded = new Set(fold.filter((id) => !forced.has(id)));
  const peeked = new Set(peek);
  const rows = [];
  const seen = new Set();

  // The solution peeked under a function: a forced one, else the first peeked one it offers; never its own choice.
  const peekedOf = (fnId, choice) => {
    const sols = solutionsOf(graph, fnId).filter((s) => s !== choice);
    return sols.find((s) => forced.has(s)) ?? sols.find((s) => peeked.has(s)) ?? null;
  };

  const visit = (id, depth, dormant, out, seenSet) => {
    const node = graph.byId.get(id);
    if (node.type !== 'function') {
      out.push({ id, depth, kind: 'component', dormant, repeat: false, foldable: false, folded: false, hidden: 0 });
      return;
    }
    const repeat = seenSet.has(id);
    seenSet.add(id);
    const sols = solutionsOf(graph, id);
    const choice = sols.includes(entryOf(design, id).choice) ? entryOf(design, id).choice : null;
    const peek1 = sols.length ? peekedOf(id, choice) : null;
    const row = { id, depth, kind: 'function', dormant, repeat, foldable: false, folded: false, hidden: 0, solutions: sols, peeked: peek1 };
    out.push(row);
    if (repeat) return;

    const sub = [];
    const isFolded = folded.has(id);
    const seenKids = isFolded ? new Set(seenSet) : seenSet; // a hidden subtree must not turn later lines into repeats
    const kids = (list, dorm) => { for (const k of list) if (graph.byId.has(k)) visit(k, depth + 1, dorm, sub, seenKids); };
    if (!sols.length) kids(node.how ?? [], dormant);
    if (choice) kids(graph.byId.get(choice).how ?? [], dormant);
    if (peek1) kids(graph.byId.get(peek1).how ?? [], true);
    row.foldable = sub.length > 0;
    if (isFolded) {
      row.folded = true;
      row.hidden = sub.length;
    } else {
      out.push(...sub);
    }
  };

  visit(graph.rootId, 0, false, rows, seen);
  for (const n of graph.nodes) {
    if (n.type === 'constraint') rows.push({ id: n.id, depth: 0, kind: 'constraint', dormant: false, repeat: false, foldable: false, folded: false, hidden: 0 });
  }
  return rows;
}

// New `peek` list after toggling solution `solId` (of function `fnId`): one peeked solution per function.
export function togglePeek(graph, peek, fnId, solId) {
  const rest = peek.filter((p) => !solutionsOf(graph, fnId).includes(p));
  return peek.includes(solId) ? rest : [...rest, solId];
}

export const toggleFold = (fold, id) => (fold.includes(id) ? fold.filter((f) => f !== id) : [...fold, id]);
