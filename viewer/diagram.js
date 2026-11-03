import { analyze } from './select.js';

// Quoted Mermaid labels: '#' first, then characters that could end the label or inject markup.
const ESC = { '#': '#35;', '"': '#quot;', '<': '#lt;', '>': '#gt;', '[': '#91;', ']': '#93;', '|': '#124;', '&': '#38;' };
const esc = (s) => String(s).replace(/[#"<>[\]|&]/g, (c) => ESC[c]);

// Decision boxes are named d0, d1, ... in the order of the decisions in the graph.
export const boxId = (graph, decisionId) => `d${graph.nodes.filter((n) => n.type === 'decision').findIndex((d) => d.id === decisionId)}`;

// Mermaid flowchart source for the current selection. Pure: same graph and pick give the same text.
export function buildDiagram(graph, pick) {
  const decisions = graph.nodes.filter((n) => n.type === 'decision');
  const chosen = new Set(pick);
  const choice = (d) => (d.children ?? []).find((c) => chosen.has(c));
  const box = (id) => boxId(graph, id);
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const { missing, conflicts } = analyze(graph, pick);

  const slots = new Map();
  for (const d of decisions) {
    const name = d.slot ?? 'Other';
    slots.set(name, [...(slots.get(name) ?? []), d]);
  }
  // 'Other' goes last and only exists when something is in it.
  const names = [...slots.keys()].filter((s) => s !== 'Other');
  if (slots.has('Other')) names.push('Other');

  const lines = ['flowchart LR'];
  const undecidedBoxes = [];
  names.forEach((name, i) => {
    lines.push(`  subgraph s${i}["${esc(name)}"]`);
    for (const d of slots.get(name)) {
      const pickId = choice(d);
      const label = pickId
        ? `${esc(d.title)}<br/>${esc(title(pickId))}`
        : `${esc(d.title)}<br/>undecided`;
      if (!pickId) undecidedBoxes.push(box(d.id));
      lines.push(`    ${box(d.id)}["${label}"]`);
    }
    lines.push('  end');
  });

  const styles = [];
  const edge = (text, style) => {
    styles.push(style);
    lines.push(`  ${text}`);
  };
  const seen = new Set();
  for (const id of pick) {
    for (const req of graph.byId.get(id)?.requires ?? []) {
      const from = graph.byId.get(id)?.parent;
      const to = graph.byId.get(req)?.parent;
      if (!chosen.has(req) || !graph.byId.has(from) || !graph.byId.has(to)) continue;
      const key = `${from}>${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edge(`${box(from)} --> ${box(to)}`, null);
    }
  }
  for (const [a, b] of conflicts) {
    edge(`${box(graph.byId.get(a).parent)} ---|"excludes"| ${box(graph.byId.get(b).parent)}`,
      'stroke:#a11,stroke-width:2px,stroke-dasharray:6 4');
  }
  for (const [id, by] of missing) {
    const to = graph.byId.get(id)?.parent;
    if (!graph.byId.has(to)) continue;
    for (const requirer of by) {
      edge(`${box(graph.byId.get(requirer).parent)} -.->|"needs ${esc(title(id))}"| ${box(to)}`,
        'stroke:#b45309,stroke-dasharray:2 4');
    }
  }

  lines.push('  classDef undecided stroke-dasharray:5 4,fill:#f6f6f6,color:#666');
  if (undecidedBoxes.length) lines.push(`  class ${undecidedBoxes.join(',')} undecided`);
  styles.forEach((s, i) => s && lines.push(`  linkStyle ${i} ${s}`));
  return lines.join('\n');
}
