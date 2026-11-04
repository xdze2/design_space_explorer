import { analyzeDesign, clean, entryOf } from './design.js';

// cyrb53: small synchronous 53-bit string hash. Cache keys and change detection only.
function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

// Same value, same text: object keys sorted, arrays kept in order.
const canonical = (v) => (Array.isArray(v) ? `[${v.map(canonical)}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`)}}`
  : JSON.stringify(v));

// A brief belongs to a design, not to what it holds: it stays found while the design is edited.
export const designKey = (design) => design.id;

// Changes when anything the prompt says changes: the design (without its id) and the content of the chosen nodes.
// Opening, folding and peeking are not in the design, so they cannot change it.
export function contentHash(graph, design) {
  const { design: d } = clean(graph, design);
  const { id, ...doc } = d;
  const chosen = [...new Set(Object.values(d.functions).map((e) => e.choice).filter(Boolean))].sort();
  const nodes = chosen.map((cid) => {
    const n = graph.byId.get(cid) ?? {};
    return [cid, n.title, n.body, n.sources, n.requires, n.excludes];
  });
  return hash(canonical([doc, nodes]));
}

export function promptVersion(template) {
  return /^<!--\s*version:\s*(\S+?)\s*-->/.exec(template)?.[1] ?? 'unknown';
}

export function buildPrompt(template, graph, design) {
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const a = analyzeDesign(graph, design);
  const bullet = (lines) => lines.join('\n') || 'None.';

  const constraints = Object.entries(design.constraints).map(([id, v]) => `- ${title(id)} (${id}): ${v}`);
  const head = [
    `Name: ${design.name}`,
    `Intent: ${design.intent || 'not given'}`,
    '',
    'Constraint values:',
    bullet(constraints),
  ].join('\n');

  const selected = [...a.chosen].map(([fnId, id]) => {
    const n = graph.byId.get(id);
    return [
      `### ${n.title} (${id})`,
      `Decision: ${title(fnId)}. Confidence: ${n.confidence ?? 'unknown'}.`,
      '',
      (n.body ?? '').trim(),
      '',
      `Sources: ${(n.sources ?? []).join('; ') || 'none'}`,
    ].join('\n');
  }).join('\n\n') || 'None.';

  const explored = Object.keys(design.functions).map((fnId) => {
    const e = entryOf(design, fnId);
    const lines = [];
    if (e.shortlist.length) lines.push(`  - Shortlisted: ${e.shortlist.map((s) => `${title(s)} (${s})`).join(', ')}`);
    for (const r of e.rejected) lines.push(`  - Rejected: ${title(r.id)} (${r.id}), reason: ${r.reason}`);
    if (e.notes) lines.push(`  - Notes: ${e.notes}`);
    if (!lines.length) return null;
    return [`- ${title(fnId)} (${fnId})${a.active.has(fnId) ? '' : ' [not part of the current design]'}`, ...lines].join('\n');
  }).filter(Boolean);

  const problems = [
    ...a.conflicts.map(([x, y]) => `- Conflict: ${title(x)} (${x}) excludes ${title(y)} (${y}).`),
    ...[...a.required].map(([id, by]) =>
      `- Missing requirement: ${title(id)} (${id}), required by ${by.map(title).join(', ')}.`),
  ];
  const open = a.undecided.map((id) => `- ${title(id)} (${id})`);
  return template
    .replace(/^<!--.*?-->\n?/s, '')
    .replace('{{design}}', () => head)
    .replace('{{selected}}', () => selected)
    .replace('{{explored}}', () => bullet(explored))
    .replace('{{problems}}', () => bullet(problems))
    .replace('{{undecided}}', () => bullet(open));
}

// Brief file: restricted frontmatter (`key: value` lines between `---`), then Markdown.
export function parseBrief(text) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'));
  if (!m) return { meta: {}, body: text };
  const meta = Object.fromEntries(m[1].split('\n').map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  return { meta, body: m[2].trim() };
}
