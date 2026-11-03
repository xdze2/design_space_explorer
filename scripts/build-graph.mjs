import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const TYPES = ['root', 'decision', 'option', 'component'];
const CONFIDENCES = ['low', 'medium', 'high'];
const REF_FIELDS = ['requires', 'excludes', 'compatible_with'];

function listMarkdown(dir) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...listMarkdown(path));
    else if (name.endsWith('.md')) files.push(path);
  }
  return files;
}

function parseNode(path, id) {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${id}: missing YAML frontmatter`);
  let meta;
  try {
    meta = parse(match[1]) ?? {};
  } catch (e) {
    throw new Error(`${id}: invalid YAML frontmatter (${e.message})`);
  }
  return { id, ...meta, body: match[2].trim() };
}

function isStringList(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function validate(nodes) {
  const errors = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  for (const n of nodes) {
    if (typeof n.title !== 'string' || !n.title) errors.push(`${n.id}: missing title`);
    if (!TYPES.includes(n.type)) errors.push(`${n.id}: type must be one of ${TYPES.join(', ')}`);
    if (!isStringList(n.sources) || n.sources.length === 0) {
      errors.push(`${n.id}: sources must be a non-empty list`);
    }
    if (n.confidence !== undefined && !CONFIDENCES.includes(n.confidence)) {
      errors.push(`${n.id}: confidence must be one of ${CONFIDENCES.join(', ')}`);
    }
    for (const field of REF_FIELDS) {
      if (n[field] === undefined) continue;
      if (!isStringList(n[field])) {
        errors.push(`${n.id}: ${field} must be a list of node ids`);
        continue;
      }
      for (const ref of n[field]) {
        if (!byId.has(ref)) errors.push(`${n.id}: ${field} references unknown node "${ref}"`);
      }
    }
    if (n.type !== 'root') {
      if (!n.parent) errors.push(`${n.id}: non-root node has no parent`);
      else if (!byId.has(n.parent)) errors.push(`${n.id}: parent references unknown node "${n.parent}"`);
    }
  }

  const roots = nodes.filter((n) => n.type === 'root');
  if (roots.length !== 1) errors.push(`expected exactly one root node, found ${roots.length}`);

  for (const n of nodes) {
    const seen = new Set([n.id]);
    let cur = n;
    while (cur.parent && byId.has(cur.parent)) {
      cur = byId.get(cur.parent);
      if (seen.has(cur.id)) {
        if (cur.id === n.id) errors.push(`${n.id}: parent cycle`);
        break;
      }
      seen.add(cur.id);
    }
  }
  return errors;
}

function compile(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n, children: [] }]));
  for (const n of byId.values()) {
    if (n.parent) byId.get(n.parent).children.push(n.id);
  }
  // excludes is symmetric: make both directions explicit
  for (const n of byId.values()) {
    for (const other of n.excludes ?? []) {
      const o = byId.get(other);
      o.excludes = [...new Set([...(o.excludes ?? []), n.id])];
    }
  }
  return [...byId.values()];
}

export function buildGraph(graphDir, outFile) {
  const root = resolve(graphDir);
  const errors = [];
  const nodes = [];
  for (const path of listMarkdown(root)) {
    const id = relative(root, path).replace(/\\/g, '/').replace(/\.md$/, '');
    try {
      nodes.push(parseNode(path, id));
    } catch (e) {
      errors.push(e.message);
    }
  }
  errors.push(...validate(nodes));
  if (errors.length) return { errors };
  const graph = { nodes: compile(nodes) };
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
