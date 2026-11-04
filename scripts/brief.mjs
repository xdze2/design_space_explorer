import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { designKey, contentHash, promptVersion } from '../viewer/brief.js';
import { clean, isEmpty } from '../viewer/design.js';

export function toGraph(data) {
  return { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])), rootId: data.root };
}

// Writes <root>/briefs/<design id>.md and updates <root>/briefs/index.json. Returns the design id.
// `raw` is an exported design file; anything in it that does not fit the graph is an error here, not dropped.
export async function saveBrief({ root, graph, raw, text, model = 'unknown' }) {
  const { design, dropped } = clean(graph, raw);
  if (dropped.length) throw new Error(`The design file does not fit graph.json: ${dropped.join('; ')}`);
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
  const dir = join(root, 'briefs');
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
  const m = rest.indexOf('--model');
  const model = m >= 0 ? rest[m + 1] : undefined;
  if (cmd !== 'save' || !designFile || !file) {
    console.error('usage: brief save <design.json> <brief.md> [--model name]');
    process.exit(2);
  }
  const root = resolve('.');
  const graph = toGraph(JSON.parse(await readFile(join(root, 'graph.json'), 'utf8')));
  const raw = JSON.parse(await readFile(designFile, 'utf8'));
  const key = await saveBrief({ root, graph, raw, text: await readFile(file, 'utf8'), model });
  console.log(`Saved briefs/${key}.md`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
