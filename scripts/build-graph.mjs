import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const TYPES = ['root', 'decision', 'option', 'component'];
const CONFIDENCES = ['low', 'medium', 'high'];
const LINK_TYPES = ['parent', 'requires', 'excludes', 'compatible_with'];
const ID_PATTERN = /^[0-9a-f]{8}$/;

function listMarkdown(dir) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...listMarkdown(path));
    else if (name.endsWith('.md')) files.push(path);
  }
  return files;
}

function parseNode(path, file) {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing YAML frontmatter`);
  let meta;
  try {
    meta = parse(match[1]) ?? {};
  } catch (e) {
    throw new Error(`${file}: invalid YAML frontmatter (${e.message})`);
  }
  return { ...meta, body: match[2].trim(), file };
}

function isStringList(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

// Returns the nodes that passed the per-node checks; their errors go to `errors`.
function validateNodes(nodes, errors) {
  const byId = new Map();
  for (const n of nodes) {
    const bad = (msg) => errors.push(`${n.file}: ${msg}`);
    if (typeof n.id !== 'string' || !ID_PATTERN.test(n.id)) {
      bad('id must be 8 lowercase hexadecimal characters (quote it in YAML)');
    } else if (byId.has(n.id)) {
      bad(`duplicate id ${n.id} (also in ${byId.get(n.id).file})`);
    } else {
      byId.set(n.id, n);
    }
    if (typeof n.title !== 'string' || !n.title) bad('missing title');
    if (!TYPES.includes(n.type)) bad(`type must be one of ${TYPES.join(', ')}`);
    if (!isStringList(n.sources) || n.sources.length === 0) bad('sources must be a non-empty list');
    if (n.confidence !== undefined && !CONFIDENCES.includes(n.confidence)) {
      bad(`confidence must be one of ${CONFIDENCES.join(', ')}`);
    }
    if (n.slot !== undefined && (typeof n.slot !== 'string' || !n.slot.trim())) {
      bad('slot must be a non-empty string');
    }
    for (const field of LINK_TYPES) {
      if (n[field] !== undefined) bad(`${field} is a link: move it to links.jsonl`);
    }
  }
  const roots = nodes.filter((n) => n.type === 'root');
  if (roots.length !== 1) errors.push(`expected exactly one root node, found ${roots.length}`);
  return byId;
}

function readLinks(file, byId, errors) {
  if (!existsSync(file)) return [];
  const links = [];
  const seen = new Map();
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((text, i) => {
    if (!text.trim()) return;
    const at = `links.jsonl:${i + 1}`;
    let link;
    try {
      link = JSON.parse(text);
    } catch {
      errors.push(`${at}: not valid JSON`);
      return;
    }
    if (link === null || typeof link !== 'object' || Array.isArray(link)) {
      errors.push(`${at}: not a JSON object`);
      return;
    }
    const missing = ['from', 'to', 'type', 'src'].filter((k) => typeof link[k] !== 'string' || !link[k]);
    if (missing.length) {
      errors.push(`${at}: missing or invalid ${missing.join(', ')}`);
      return;
    }
    if (!LINK_TYPES.includes(link.type)) {
      errors.push(`${at}: unknown link type "${link.type}"`);
      return;
    }
    let ok = true;
    for (const end of ['from', 'to']) {
      if (!byId.has(link[end])) {
        errors.push(`${at}: ${end} references unknown node "${link[end]}"`);
        ok = false;
      }
    }
    if (ok && link.from === link.to) {
      errors.push(`${at}: link from ${link.from} to itself`);
      ok = false;
    }
    const key = `${link.type} ${link.from} ${link.to}`;
    if (seen.has(key)) {
      errors.push(`${at}: duplicate of line ${seen.get(key)} (${link.type} ${link.from} -> ${link.to})`);
      return;
    }
    seen.set(key, i + 1);
    if (ok) links.push(link);
  });
  return links;
}

function checkHierarchy(nodes, parents, errors) {
  for (const n of nodes) {
    if (n.type !== 'root' && !parents.get(n.id).length) errors.push(`${n.file}: non-root node has no parent`);
  }
  // DFS over all parent edges; 1 = on the current path, 2 = done
  const state = new Map();
  const visit = (id) => {
    state.set(id, 1);
    for (const p of parents.get(id)) {
      if (state.get(p) === 1) errors.push(`${p}: parent cycle`);
      else if (!state.has(p)) visit(p);
    }
    state.set(id, 2);
  };
  for (const n of nodes) if (!state.has(n.id)) visit(n.id);
}

function compile(nodes, links, parents) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lists = { requires: new Map(), excludes: new Map(), compatible_with: new Map() };
  for (const field of Object.keys(lists)) for (const n of nodes) lists[field].set(n.id, new Set());
  for (const l of links) {
    if (l.type === 'parent') continue;
    lists[l.type].get(l.from).add(l.to);
    // excludes is symmetric: make both directions explicit
    if (l.type === 'excludes') lists.excludes.get(l.to).add(l.from);
  }
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const n of nodes) for (const p of parents.get(n.id)) children.get(p).push(n.id);
  const byTitle = (a, b) => byId.get(a).title.localeCompare(byId.get(b).title) || (a < b ? -1 : 1);

  return [...nodes]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map(({ file, body, ...meta }) => {
      const ps = parents.get(meta.id);
      return {
        ...meta,
        body,
        ...(ps.length ? { parent: ps[0] } : {}),
        parents: ps,
        children: children.get(meta.id).sort(byTitle),
        requires: [...lists.requires.get(meta.id)].sort(),
        excludes: [...lists.excludes.get(meta.id)].sort(),
        compatible_with: [...lists.compatible_with.get(meta.id)].sort(),
      };
    });
}

export function buildGraph(graphDir, outFile) {
  const root = resolve(graphDir);
  const errors = [];
  const nodes = [];
  for (const path of listMarkdown(root)) {
    const file = relative(root, path).replace(/\\/g, '/');
    try {
      nodes.push(parseNode(path, file));
    } catch (e) {
      errors.push(e.message);
    }
  }
  const byId = validateNodes(nodes, errors);
  const links = readLinks(join(root, 'links.jsonl'), byId, errors);
  const parents = new Map([...byId.keys()].map((id) => [id, []]));
  for (const l of links) if (l.type === 'parent') parents.get(l.from).push(l.to);
  if (!errors.length) checkHierarchy(nodes, parents, errors);
  if (errors.length) return { errors };
  const graph = { nodes: compile(nodes, links, parents) };
  writeFileSync(outFile, JSON.stringify(graph, null, 2) + '\n');
  return { errors: [], graph };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const graphDir = process.argv[2] ?? 'graph';
  const outFile = process.argv[3] ?? 'graph.json';
  const { errors, graph } = buildGraph(graphDir, outFile);
  if (errors.length) {
    console.error(errors.map((e) => `error: ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`wrote ${outFile} (${graph.nodes.length} nodes)`);
}
