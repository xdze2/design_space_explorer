import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { designKey, contentHash, promptVersion } from '../viewer/brief.js';
import { clean, isEmpty, DEFAULT_TOPIC, TOPIC_RE } from '../viewer/design.js';

export function toGraph(data) {
  return { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])), rootId: data.root };
}

// Writes <root>/topics/<topic>/briefs/<design id>.md and updates its index.json. Returns the design id.
// `raw` is an exported design file; anything in it that does not fit the graph is an error here, not dropped.
export async function saveBrief({ root, graph, raw, text, model = 'unknown', topic = DEFAULT_TOPIC }) {
  if (!TOPIC_RE.test(topic)) throw new Error(`Invalid topic "${topic}"`);
  if (raw?.topic !== undefined && raw.topic !== topic) throw new Error(`The design file is for topic "${raw.topic}", not "${topic}"`);
  const { design, dropped } = clean(graph, raw);
  if (dropped.length) throw new Error(`The design file does not fit the topic's graph.json: ${dropped.join('; ')}`);
  if (!raw.id || raw.id !== design.id) throw new Error('The design file has no valid "id"');
  if (isEmpty(design)) throw new Error('Empty design');
  const key = designKey(design);
  const template = await readFile(join(root, 'prompts/brief.md'), 'utf8');
  const frontmatter = [
    '---',
    `design_id: ${key}`,
    `design_name: ${design.name.replace(/\s+/g, ' ')}`,
    `content_hash: ${contentHash(graph, design)}`,
    `model: ${model}`,
    `prompt_version: ${promptVersion(template)}`,
    `created: ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
  ].join('\n');
  const dir = join(root, 'topics', topic, 'briefs');
  await mkdir(dir, { recursive: true });
  const indexPath = join(dir, 'index.json');
  const index = await readFile(indexPath, 'utf8').then(JSON.parse, () => ({}));
  index[key] = { file: `${key}.md` };
  await writeFile(join(dir, `${key}.md`), frontmatter + text.trim() + '\n');
  await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
  return key;
}

async function main(argv) {
  const [cmd, designFile, file, ...rest] = argv;
  const opt = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };
  const model = opt('--model');
  const topic = opt('--topic') ?? DEFAULT_TOPIC;
  if (cmd !== 'save' || !designFile || !file) {
    console.error('usage: brief save <design.json> <brief.md> [--topic name] [--model name]');
    process.exit(2);
  }
  if (!TOPIC_RE.test(topic)) {
    console.error(`Invalid topic "${topic}"`);
    process.exit(2);
  }
  const root = resolve('.');
  const graph = toGraph(JSON.parse(await readFile(join(root, 'topics', topic, 'graph.json'), 'utf8')));
  const raw = JSON.parse(await readFile(designFile, 'utf8'));
  const key = await saveBrief({ root, graph, raw, text: await readFile(file, 'utf8'), model, topic });
  console.log(`Saved topics/${topic}/briefs/${key}.md`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
