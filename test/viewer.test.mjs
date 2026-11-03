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

test('hash: page, pick and view round trip', () => {
  const s = parseHash('#/design?pick=gantry/corexy,drive/gt2-belt&view=gantry/h-bot', known);
  assert.deepEqual(s, {
    page: 'design', pick: ['gantry/corexy', 'drive/gt2-belt'], view: 'gantry/h-bot', unknown: [],
  });
  assert.deepEqual(parseHash('#/graph', known), { page: 'graph', pick: [], view: null, unknown: [] });
  assert.equal(buildHash('design', { pick: ['a/b', 'c/d'] }), '#/design?pick=a/b,c/d');
  assert.equal(buildHash('design'), '#/design');
  assert.equal(buildHash('graph', { pick: ['x/y'], view: 'gantry/corexy' }), '#/graph?pick=x/y&view=gantry/corexy');
});

test('hash: default and aliases', () => {
  assert.equal(parseHash('', known).page, 'design');
  assert.equal(parseHash('#/nonsense', known).page, 'design');
  assert.equal(parseHash('#/selection?pick=gantry/corexy', known).page, 'design');
  assert.equal(parseHash('#/browse', known).page, 'graph');
});

test('hash: legacy browse links read as view', () => {
  assert.deepEqual(parseHash('#/browse/gantry/corexy', known), {
    page: 'graph', pick: [], view: 'gantry/corexy', unknown: [],
  });
  const b = parseHash('#/browse/drive/leadscrew?pick=gantry/corexy', known);
  assert.deepEqual([b.view, b.pick], ['drive/leadscrew', ['gantry/corexy']]);
  assert.equal(parseHash('#/browse/root', known).view, null);
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual(b.unknown, ['gantry/doesnotexist']);
  assert.equal(b.view, null);
  const v = parseHash('#/design?view=nope', known);
  assert.deepEqual([v.view, v.unknown], [null, ['nope']]);
  const s = parseHash('#/design?pick=gantry/corexy,nope', known);
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

import { buildDiagram } from '../viewer/diagram.js';

const subgraph = (src, name) => src.split('\n').slice(src.split('\n').findIndex((l) => l.includes(`["${name}"]`) && l.includes('subgraph')))
  .join('\n').split('  end')[0];

test('diagram: slots become groups', () => {
  const src = buildDiagram(graph, []);
  const motion = subgraph(src, 'Motion');
  for (const t of ['Gantry geometry', 'Drive', 'Linear guide']) assert.ok(motion.includes(t), t);
  assert.ok(subgraph(src, 'Tool').includes('Pen lift'));
  assert.ok(subgraph(src, 'Electronics').includes('ontroller'));
  assert.ok(!src.includes('"Other"'));
});

test('diagram: decisions without a slot go to Other', () => {
  const nodes = data.nodes.map((n) => (n.id === 'drive' ? { ...n, slot: undefined } : n));
  const src = buildDiagram({ nodes, byId: new Map(nodes.map((n) => [n.id, n])) }, []);
  assert.ok(subgraph(src, 'Other').includes('Drive'));
});

test('diagram: decided and undecided boxes', () => {
  const src = buildDiagram(graph, ['gantry/corexy']);
  assert.ok(src.includes('CoreXY'));
  assert.equal(src.split('undecided<').length - 1 + src.split('undecided"').length - 1, 4);
  assert.match(src, /class d\d(,d\d)+ undecided/);
});

test('diagram: requirement, missing and conflict edges', () => {
  const both = buildDiagram(graph, ['gantry/corexy', 'drive/gt2-belt']);
  assert.match(both, /d\d --> d\d/);
  assert.ok(!both.includes('needs') && !both.includes('excludes'));
  const missing = buildDiagram(graph, ['gantry/corexy']);
  assert.match(missing, /d\d -\.->\|"needs GT2 belt[^"]*"\| d\d/);
  const conflict = buildDiagram(graph, ['gantry/corexy', 'drive/leadscrew']);
  assert.match(conflict, /d\d ---\|"excludes"\| d\d/);
  assert.match(conflict, /linkStyle \d .*stroke-dasharray/);
});

test('diagram: titles cannot alter the source', () => {
  const evil = 'A "q" [b] <script>x</script> | #';
  const nodes = data.nodes.map((n) => (n.id === 'gantry/corexy' ? { ...n, title: evil } : n));
  const src = buildDiagram({ nodes, byId: new Map(nodes.map((n) => [n.id, n])) }, ['gantry/corexy']);
  assert.ok(!src.includes('<script>') && !src.includes('A "q"'));
  assert.ok(src.includes('A #quot;q#quot; #91;b#93; #lt;script#gt;x#lt;/script#gt; #124; #35;'));
});
