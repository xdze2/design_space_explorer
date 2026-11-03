import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { toggle, analyze, undecided } from '../viewer/select.js';

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

test('hash: browse and selection round trip, pick kept on both pages', () => {
  assert.deepEqual(parseHash('#/browse/gantry/corexy', known), {
    page: 'browse', params: { id: 'gantry/corexy' }, pick: [], unknown: [],
  });
  const s = parseHash('#/selection?pick=gantry/corexy,drive/gt2-belt', known);
  assert.equal(s.page, 'selection');
  assert.deepEqual(s.pick, ['gantry/corexy', 'drive/gt2-belt']);
  const b = parseHash('#/browse/drive/leadscrew?pick=gantry/corexy', known);
  assert.deepEqual([b.params.id, b.pick], ['drive/leadscrew', ['gantry/corexy']]);
  assert.equal(buildHash('selection', {}, ['a/b', 'c/d']), '#/selection?pick=a/b,c/d');
  assert.equal(buildHash('selection'), '#/selection');
  assert.equal(buildHash('browse', { id: 'gantry/corexy' }, ['x/y']), '#/browse/gantry/corexy?pick=x/y');
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual(b.unknown, ['gantry/doesnotexist']);
  assert.equal(b.params.id, 'root');
  const s = parseHash('#/selection?pick=gantry/corexy,nope', known);
  assert.deepEqual(s.pick, ['gantry/corexy']);
  assert.deepEqual(s.unknown, ['nope']);
});

test('select: undecided decisions', () => {
  const ids = undecided(graph, ['gantry/corexy']).map((n) => n.id).sort();
  assert.deepEqual(ids, ['controller', 'drive', 'linear-guide', 'pen-lift']);
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

import { selectionKey, contentHash, buildPrompt } from '../viewer/brief.js';

const withBody = (id, body) => {
  const nodes = data.nodes.map((n) => (n.id === id ? { ...n, body } : n));
  return { nodes, byId: new Map(nodes.map((n) => [n.id, n])) };
};

test('brief: key ignores order, differs for another set', () => {
  assert.equal(selectionKey(['gantry/corexy', 'drive/gt2-belt']), selectionKey(['drive/gt2-belt', 'gantry/corexy']));
  assert.notEqual(selectionKey(['gantry/corexy']), selectionKey(['gantry/corexy', 'drive/gt2-belt']));
});

test('brief: content hash follows selected nodes only', () => {
  const pick = ['gantry/corexy'];
  const base = contentHash(graph, pick);
  assert.notEqual(contentHash(withBody('gantry/corexy', 'changed'), pick), base);
  assert.equal(contentHash(withBody('drive/leadscrew', 'changed'), pick), base);
});

test('brief: prompt has body, missing requirement and undecided decisions', () => {
  const template = readFileSync(new URL('../prompts/brief.md', import.meta.url), 'utf8');
  const prompt = buildPrompt(template, graph, ['gantry/corexy']);
  assert.ok(prompt.includes(graph.byId.get('gantry/corexy').body.trim()));
  assert.ok(prompt.includes('Missing requirement: ') && prompt.includes('(drive/gt2-belt)'));
  for (const d of undecided(graph, ['gantry/corexy'])) assert.ok(prompt.includes(`(${d.id})`));
  assert.ok(!prompt.includes('{{') && !prompt.includes('version:'));
});
