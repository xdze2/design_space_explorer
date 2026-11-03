import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { toggle, analyze } from '../viewer/select.js';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])) };
const known = new Set(graph.byId.keys());

test('markdown: paragraphs, bold, code, lists', () => {
  const html = renderMarkdown('**Hi** `x`\n\n- a\n- b');
  assert.equal(html, '<p><strong>Hi</strong> <code>x</code></p>\n<ul><li>a</li><li>b</li></ul>');
});

test('markdown: HTML is escaped', () => {
  const html = renderMarkdown('<script>alert(1)</script> **b**');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('hash: browse and select round trip', () => {
  assert.deepEqual(parseHash('#/browse/gantry/corexy', known), {
    view: 'browse', params: { id: 'gantry/corexy' }, unknown: [],
  });
  assert.deepEqual(parseHash('#/select?pick=gantry/corexy,drive/gt2-belt', known).params.pick, [
    'gantry/corexy', 'drive/gt2-belt',
  ]);
  assert.equal(buildHash('select', { pick: ['a/b', 'c/d'] }), '#/select?pick=a/b,c/d');
  assert.equal(buildHash('browse', { id: 'gantry/corexy' }), '#/browse/gantry/corexy');
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual(b.unknown, ['gantry/doesnotexist']);
  assert.equal(b.params.id, 'root');
  const s = parseHash('#/select?pick=gantry/corexy,nope', known);
  assert.deepEqual(s.params.pick, ['gantry/corexy']);
  assert.deepEqual(s.unknown, ['nope']);
});

test('select: exclusion shown', () => {
  const { excluded } = analyze(graph, ['gantry/corexy']);
  assert.equal(excluded.get('drive/leadscrew'), 'gantry/corexy');
});

test('select: missing requirement shown', () => {
  const { missing } = analyze(graph, ['gantry/corexy']);
  assert.deepEqual([...missing.keys()], ['drive/gt2-belt']);
  assert.deepEqual(analyze(graph, ['gantry/corexy', 'drive/gt2-belt']).missing.size, 0);
});

test('select: one option per decision', () => {
  assert.deepEqual(toggle(graph, ['gantry/corexy'], 'gantry/h-bot'), ['gantry/h-bot']);
  assert.deepEqual(toggle(graph, ['gantry/corexy'], 'drive/gt2-belt'), ['gantry/corexy', 'drive/gt2-belt']);
  assert.deepEqual(toggle(graph, ['gantry/corexy'], 'gantry/corexy'), []);
});

test('select: conflict', () => {
  const { conflicts } = analyze(graph, ['gantry/corexy', 'drive/leadscrew']);
  assert.equal(conflicts.length, 1);
  assert.deepEqual([...conflicts[0]].sort(), ['drive/leadscrew', 'gantry/corexy']);
});
