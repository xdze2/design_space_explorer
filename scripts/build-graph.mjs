import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const TYPES = ['function', 'solution', 'component', 'constraint'];
const CONFIDENCES = ['low', 'medium', 'high'];
const LINK_TYPES = ['how', 'constrains', 'requires', 'excludes', 'compatible_with', 'fares'];
// fields that used to live in the frontmatter and are now links (or gone)
const FORBIDDEN_FIELDS = ['slot', 'parent', 'requires', 'excludes', 'compatible_with'];
// allowed "from>to" type pairs of a how link
const HOW_PAIRS = ['function>function', 'function>solution', 'solution>function', 'solution>component'];
const SELECTABLE = ['solution', 'component'];
const ID_PATTERN = /^[0-9a-f]{8}$/;
const SCORES = [-2, -1, 1, 2];
const SUMMARY_MAX = 120;
const IMG_MAX_BYTES = 50 * 1024;

// Node files sit directly under `dir`; a .md file in a subfolder is reported in `nested`.
function listMarkdown(dir, nested, top = true) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...listMarkdown(path, nested, false));
    else if (name.endsWith('.md')) (top ? files : nested).push(path);
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
    if (!TYPES.includes(n.type)) bad(`type "${n.type}" is not allowed, must be one of ${TYPES.join(', ')}`);
    if (!isStringList(n.sources) || n.sources.length === 0) bad('sources must be a non-empty list');
    if (n.confidence !== undefined && !CONFIDENCES.includes(n.confidence)) {
      bad(`confidence must be one of ${CONFIDENCES.join(', ')}`);
    }
    if (n.summary !== undefined && (typeof n.summary !== 'string' || /[\r\n]/.test(n.summary) || n.summary.length > SUMMARY_MAX)) {
      bad(`summary must be a single line of at most ${SUMMARY_MAX} characters`);
    }
    if (n.abbr !== undefined && !/^[A-Za-z0-9]{1,4}$/.test(String(n.abbr))) {
      bad('abbr must be 1 to 4 letters or digits');
    }
    for (const field of FORBIDDEN_FIELDS) {
      if (n[field] !== undefined) bad(`${field} is not allowed in the frontmatter (links go in links.jsonl)`);
    }
  }
  return byId;
}

// Type-pair rules; returns false (after reporting) when the link is not allowed.
function checkPair(at, link, byId, errors) {
  const a = byId.get(link.from).type;
  const b = byId.get(link.to).type;
  if (!TYPES.includes(a) || !TYPES.includes(b)) return true; // reported on the node already
  const pair = `${a}>${b}`;
  const fail = (rule) => {
    errors.push(`${at}: ${link.type} link from ${a} to ${b} is not allowed (${rule})`);
    return false;
  };
  if (link.type === 'how') {
    if (a === 'constraint' || b === 'constraint') return fail('constraints have no how links');
    if (!HOW_PAIRS.includes(pair)) return fail(`how joins ${HOW_PAIRS.join(', ')}`);
  } else if (link.type === 'constrains') {
    if (pair !== 'constraint>function') return fail('constrains goes from a constraint to a function');
  } else if (link.type === 'fares') {
    if (!SELECTABLE.includes(a) || b !== 'constraint') return fail('fares goes from a solution or component to a constraint');
  } else if (!SELECTABLE.includes(a) || !SELECTABLE.includes(b)) {
    return fail('only solutions and components can be linked this way');
  }
  return true;
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
    if (link.type === 'parent') {
      errors.push(`${at}: link type "parent" was replaced by "how" (from the why end to the how end)`);
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
    if (link.order !== undefined) {
      if (link.type !== 'how') {
        errors.push(`${at}: order is only allowed on how links`);
        return;
      }
      if (!Number.isInteger(link.order)) {
        errors.push(`${at}: order must be an integer`);
        return;
      }
    }
    if (link.type === 'fares') {
      if (!SCORES.includes(link.score)) {
        errors.push(`${at}: fares needs a score of ${SCORES.join(', ')}`);
        return;
      }
    } else if (link.score !== undefined) {
      errors.push(`${at}: score is only allowed on fares links`);
      return;
    }
    const key = `${link.type} ${link.from} ${link.to}`;
    if (seen.has(key)) {
      errors.push(`${at}: duplicate of line ${seen.get(key)} (${link.type} ${link.from} -> ${link.to})`);
      return;
    }
    seen.set(key, i + 1);
    if (ok) ok = checkPair(at, link, byId, errors);
    if (ok) links.push(link);
  });
  return links;
}

function checkHierarchy(nodes, whys, hows, byId, errors) {
  // a function's how targets are all functions or all solutions
  for (const n of nodes) {
    if (n.type !== 'function') continue;
    const kinds = new Set(hows.get(n.id).map((id) => byId.get(id).type));
    if (kinds.has('function') && kinds.has('solution')) {
      errors.push(`${n.file}: function has both function and solution how targets`);
    }
  }
  const tree = nodes.filter((n) => n.type !== 'constraint');
  const roots = tree.filter((n) => n.type === 'function' && !whys.get(n.id).length);
  if (roots.length !== 1) {
    const names = roots.map((n) => n.file).join(', ');
    errors.push(`expected exactly one root function (a function with no why), found ${roots.length}${names ? `: ${names}` : ''}`);
  }
  // DFS over why edges; 1 = on the current path, 2 = done
  const state = new Map();
  const visit = (id) => {
    state.set(id, 1);
    for (const p of whys.get(id)) {
      if (state.get(p) === 1) errors.push(`${p}: how cycle`);
      else if (!state.has(p)) visit(p);
    }
    state.set(id, 2);
  };
  for (const n of tree) if (!state.has(n.id)) visit(n.id);
  if (errors.length || roots.length !== 1) return;
  // every node must reach the root by following why links
  const reached = new Set([roots[0].id]);
  const queue = [roots[0].id];
  while (queue.length) {
    for (const id of hows.get(queue.shift())) if (!reached.has(id)) { reached.add(id); queue.push(id); }
  }
  for (const n of tree) if (!reached.has(n.id)) errors.push(`${n.file}: cannot reach the root function by following how links backwards`);
  return roots[0].id;
}

// Pictures are graph/img/<id>.svg; returns the set of ids that have one.
function listPictures(dir, byId, errors) {
  const ids = new Set();
  if (!existsSync(dir)) return ids;
  for (const name of readdirSync(dir).sort()) {
    const file = `img/${name}`;
    const id = name.endsWith('.svg') ? name.slice(0, -4) : null;
    if (id === null || !byId.has(id)) {
      errors.push(`${file}: pictures must be named <node id>.svg after an existing node`);
    } else if (statSync(join(dir, name)).size > IMG_MAX_BYTES) {
      errors.push(`${file}: picture is larger than ${IMG_MAX_BYTES / 1024} kB`);
    } else {
      ids.add(id);
    }
  }
  return ids;
}

function compile(nodes, links, whys, hows, pictures) {
  const lists = {};
  for (const field of ['requires', 'excludes', 'compatible_with', 'constrains', 'constrained_by']) {
    lists[field] = new Map(nodes.map((n) => [n.id, new Set()]));
  }
  const fares = new Map(nodes.map((n) => [n.id, []]));
  for (const l of links) {
    if (l.type === 'how') continue;
    if (l.type === 'fares') {
      fares.get(l.from).push({ id: l.to, score: l.score });
      continue;
    }
    lists[l.type].get(l.from).add(l.to);
    // excludes is symmetric: make both directions explicit
    if (l.type === 'excludes') lists.excludes.get(l.to).add(l.from);
    if (l.type === 'constrains') lists.constrained_by.get(l.to).add(l.from);
  }
  return [...nodes]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map(({ file, body, ...meta }) => ({
      ...meta,
      body,
      why: whys.get(meta.id),
      how: hows.get(meta.id),
      constrains: [...lists.constrains.get(meta.id)].sort(),
      constrained_by: [...lists.constrained_by.get(meta.id)].sort(),
      requires: [...lists.requires.get(meta.id)].sort(),
      excludes: [...lists.excludes.get(meta.id)].sort(),
      compatible_with: [...lists.compatible_with.get(meta.id)].sort(),
      fares: fares.get(meta.id).sort((a, b) => (a.id < b.id ? -1 : 1)),
      ...(pictures.has(meta.id) ? { img: true } : {}),
    }));
}

export function buildGraph(graphDir, outFile) {
  const root = resolve(graphDir);
  const errors = [];
  const nodes = [];
  const nested = [];
  const top = listMarkdown(root, nested);
  for (const path of nested) {
    errors.push(`${relative(root, path).replace(/\\/g, '/')}: node files must sit directly under graph/, not in a subfolder`);
  }
  for (const path of top) {
    const file = relative(root, path).replace(/\\/g, '/');
    try {
      nodes.push(parseNode(path, file));
    } catch (e) {
      errors.push(e.message);
    }
  }
  const byId = validateNodes(nodes, errors);
  const links = readLinks(join(root, 'links.jsonl'), byId, errors);
  const whys = new Map([...byId.keys()].map((id) => [id, []]));
  const hows = new Map([...byId.keys()].map((id) => [id, []]));
  const howLinks = links.filter((l) => l.type === 'how');
  for (const l of howLinks) whys.get(l.to).push(l.from);
  // how: author order first (`order` ascending), then links without order, by title then id
  const rank = (l) => (Number.isInteger(l.order) ? l.order : Infinity);
  const title = (id) => byId.get(id).title;
  howLinks
    .sort((a, b) => (rank(a) === rank(b) ? 0 : rank(a) < rank(b) ? -1 : 1)
      || (title(a.to) < title(b.to) ? -1 : title(a.to) > title(b.to) ? 1 : 0)
      || (a.to < b.to ? -1 : 1))
    .forEach((l) => hows.get(l.from).push(l.to));
  const pictures = listPictures(join(root, 'img'), byId, errors);
  let rootId;
  if (!errors.length) rootId = checkHierarchy(nodes, whys, hows, byId, errors);
  if (errors.length) return { errors };
  const graph = { root: rootId, nodes: compile(nodes, links, whys, hows, pictures) };
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
