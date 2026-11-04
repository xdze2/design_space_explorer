import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, readFileSync as read, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveBrief, toGraph } from '../scripts/brief.mjs';
import { selectionKey } from '../viewer/brief.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = toGraph(data);
const id = idByTitle(data.nodes);

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'brief-'));
  mkdirSync(join(root, 'prompts'));
  copyFileSync(new URL('../prompts/brief.md', import.meta.url), join(root, 'prompts/brief.md'));
  return root;
}

test('saveBrief: writes file and index, replaces on second save', async () => {
  const root = tempRoot();
  const pick = [id('CoreXY'), id('GT2 belt drive')];
  const key = await saveBrief({ root, graph, pick, text: 'First', model: 'm1' });
  const file = join(root, 'briefs', `${key}.md`);
  assert.equal(key, selectionKey(pick));
  const text = read(file, 'utf8');
  assert.match(text, new RegExp(`^---\\npick: ${[...pick].sort().join(',')}\\ncontent_hash: \\w+\\nmodel: m1\\nprompt_version: 2\\n`));
  assert.ok(text.endsWith('\n---\nFirst\n') && text.includes('created: '));
  await saveBrief({ root, graph, pick: [...pick].reverse(), text: 'Second', model: 'm2' });
  assert.match(read(file, 'utf8'), /model: m2[\s\S]*Second/);
  assert.deepEqual(JSON.parse(read(join(root, 'briefs/index.json'), 'utf8')), { [key]: { file: `${key}.md` } });
  assert.equal(readdirSync(join(root, 'briefs')).length, 2);
});

test('saveBrief: unknown id throws and writes nothing', async () => {
  const root = tempRoot();
  await assert.rejects(saveBrief({ root, graph, pick: [id('CoreXY'), 'nope/x'], text: 't' }), /nope\/x/);
  assert.ok(!existsSync(join(root, 'briefs')));
});
