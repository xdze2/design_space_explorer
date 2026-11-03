import { analyze, undecided } from './select.js';

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

const sorted = (pick) => [...pick].sort();

export const selectionKey = (pick) => hash(sorted(pick).join(','));

// Changes when anything the prompt says about a selected node changes.
export function contentHash(graph, pick) {
  const parts = sorted(pick).map((id) => {
    const n = graph.byId.get(id) ?? {};
    return JSON.stringify([id, n.title, n.body, n.sources, n.requires, n.excludes]);
  });
  return hash(parts.join('\n'));
}

export function promptVersion(template) {
  return /^<!--\s*version:\s*(\S+?)\s*-->/.exec(template)?.[1] ?? 'unknown';
}

export function buildPrompt(template, graph, pick) {
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const { missing, conflicts } = analyze(graph, pick);
  const selected = pick.map((id) => {
    const n = graph.byId.get(id);
    return [
      `### ${n.title} (${id})`,
      `Decision: ${title(n.parent)}. Confidence: ${n.confidence ?? 'unknown'}.`,
      '',
      (n.body ?? '').trim(),
      '',
      `Sources: ${(n.sources ?? []).join('; ') || 'none'}`,
    ].join('\n');
  }).join('\n\n');
  const problems = [
    ...conflicts.map(([a, b]) => `- Conflict: ${title(a)} (${a}) excludes ${title(b)} (${b}).`),
    ...[...missing].map(([id, by]) =>
      `- Missing requirement: ${title(id)} (${id}), required by ${by.map(title).join(', ')}.`),
  ].join('\n') || 'None.';
  const open = undecided(graph, pick).map((d) => `- ${d.title} (${d.id})`).join('\n') || 'None.';
  return template
    .replace(/^<!--.*?-->\n?/s, '')
    .replace('{{selected}}', () => selected)
    .replace('{{problems}}', () => problems)
    .replace('{{undecided}}', () => open);
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
