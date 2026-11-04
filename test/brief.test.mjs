import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, readFileSync as read, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveBrief, toGraph } from '../scripts/brief.mjs';
import { contentHash, parseBrief } from '../viewer/brief.js';
import { emptyDesign, choose, reject } from '../viewer/design.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = toGraph(data);
const id = idByTitle(data.nodes);
const MOVE = id('Move the pen in XY');
const COREXY = id('CoreXY');

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'brief-'));
  mkdirSync(join(root, 'prompts'));
  copyFileSync(new URL('../prompts/brief.md', import.meta.url), join(root, 'prompts/brief.md'));
  return root;
}

const design = () => ({ ...choose(graph, emptyDesign(), MOVE, COREXY), name: 'My: plotter\nline two' });

test('saveBrief: writes file and index, replaces on second save', async () => {
  const root = tempRoot();
  const d = design();
  const key = await saveBrief({ root, graph, raw: d, text: 'First', model: 'm1' });
  const file = join(root, 'briefs', `${key}.md`);
  assert.equal(key, d.id);
  const text = read(file, 'utf8');
  assert.match(text, new RegExp(`^---\\ndesign_id: ${d.id}\\ndesign_name: My: plotter line two\\ncontent_hash: \\w+\\nmodel: m1\\nprompt_version: 3\\n`));
  assert.ok(text.endsWith('\n---\nFirst\n') && text.includes('created: '));
  assert.equal(parseBrief(text).meta.content_hash, contentHash(graph, d));
  const d2 = reject(graph, d, id('Lift and lower the pen'), id('Solenoid pen lift'), 'loud');
  await saveBrief({ root, graph, raw: d2, text: 'Second', model: 'm2' });
  assert.match(read(file, 'utf8'), /model: m2[\s\S]*Second/);
  assert.equal(parseBrief(read(file, 'utf8')).meta.content_hash, contentHash(graph, d2));
  assert.deepEqual(JSON.parse(read(join(root, 'briefs/index.json'), 'utf8')), { [key]: { file: `${key}.md` } });
  assert.equal(readdirSync(join(root, 'briefs')).length, 2);
});

test('saveBrief: unknown id throws and writes nothing', async () => {
  const root = tempRoot();
  const raw = { ...design(), functions: { ...design().functions, 'nope/x': { choice: COREXY } } };
  await assert.rejects(saveBrief({ root, graph, raw, text: 't' }), /nope\/x/);
  assert.ok(!existsSync(join(root, 'briefs')));
});

test('saveBrief: an invalid entry, a missing id and an empty design write nothing', async () => {
  const root = tempRoot();
  const wrong = { ...design(), functions: { [id('Lift and lower the pen')]: { choice: COREXY } } };
  await assert.rejects(saveBrief({ root, graph, raw: wrong, text: 't' }), /not a solution/);
  const { id: _omit, ...noId } = design();
  await assert.rejects(saveBrief({ root, graph, raw: noId, text: 't' }), /"id"/);
  await assert.rejects(saveBrief({ root, graph, raw: emptyDesign(), text: 't' }), /Empty design/);
  assert.ok(!existsSync(join(root, 'briefs')));
});
