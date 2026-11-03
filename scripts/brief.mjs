import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectionKey, contentHash, promptVersion } from '../viewer/brief.js';

export function toGraph(data) {
  return { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])) };
}

// Writes <root>/briefs/<key>.md and updates <root>/briefs/index.json. Returns the key.
export async function saveBrief({ root, graph, pick, text, model = 'unknown' }) {
  const unknown = pick.filter((id) => !graph.byId.has(id));
  if (unknown.length) throw new Error(`Unknown node id: ${unknown.join(', ')}`);
  if (!pick.length) throw new Error('Empty selection');
  const key = selectionKey(pick);
  const template = await readFile(join(root, 'prompts/brief.md'), 'utf8');
  const frontmatter = [
    '---',
    `pick: ${[...pick].sort().join(',')}`,
    `content_hash: ${contentHash(graph, pick)}`,
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
  const [cmd, ids, file, ...rest] = argv;
  const m = rest.indexOf('--model');
  const model = m >= 0 ? rest[m + 1] : undefined;
  if (cmd !== 'save' || !ids || !file) {
    console.error('usage: brief save <id>,<id> <file.md> [--model name]');
    process.exit(2);
  }
  const root = resolve('.');
  const graph = toGraph(JSON.parse(await readFile(join(root, 'graph.json'), 'utf8')));
  const key = await saveBrief({ root, graph, pick: ids.split(','), text: await readFile(file, 'utf8'), model });
  console.log(`Saved briefs/${key}.md`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
