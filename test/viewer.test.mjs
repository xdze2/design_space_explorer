import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { toggle, analyze, undecided } from '../viewer/select.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])) };
const known = new Set(graph.byId.keys());
const id = idByTitle(data.nodes);
const COREXY = id('CoreXY');
const HBOT = id('H-bot');
const BELT = id('GT2 belt, 6 mm');
const LEADSCREW = id('Leadscrew');
const GANTRY = id('Gantry geometry');

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
  const s = parseHash(`#/design?pick=${COREXY},${BELT}&view=${HBOT}`, known);
  assert.deepEqual(s, {
    page: 'design', pick: [COREXY, BELT], view: HBOT, up: 3, down: 2, unknown: [],
  });
  assert.deepEqual(parseHash('#/graph', known), { page: 'graph', pick: [], view: null, up: 3, down: 2, unknown: [] });
  assert.equal(buildHash('design', { pick: ['a/b', 'c/d'] }), '#/design?pick=a/b,c/d');
  assert.equal(buildHash('design'), '#/design');
  assert.equal(buildHash('graph', { pick: ['x/y'], view: 'gantry/corexy' }), '#/graph?pick=x/y&view=gantry/corexy');
});

test('hash: default and aliases', () => {
  assert.equal(parseHash('', known).page, 'design');
  assert.equal(parseHash('#/nonsense', known).page, 'design');
  assert.equal(parseHash(`#/selection?pick=${COREXY}`, known).page, 'design');
  assert.equal(parseHash('#/browse', known).page, 'graph');
});

test('hash: legacy browse links read as view', () => {
  assert.deepEqual(parseHash(`#/browse/${COREXY}`, known), {
    page: 'graph', pick: [], view: COREXY, up: 3, down: 2, unknown: [],
  });
  const b = parseHash(`#/browse/${LEADSCREW}?pick=${COREXY}`, known);
  assert.deepEqual([b.view, b.pick], [LEADSCREW, [COREXY]]);
  assert.equal(parseHash('#/browse/root', known).view, null);
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual(b.unknown, ['gantry/doesnotexist']);
  assert.equal(b.view, null);
  const v = parseHash('#/design?view=nope', known);
  assert.deepEqual([v.view, v.unknown], [null, ['nope']]);
  const s = parseHash(`#/design?pick=${COREXY},nope`, known);
  assert.deepEqual(s.pick, [COREXY]);
  assert.deepEqual(s.unknown, ['nope']);
});

test('select: undecided decisions', () => {
  const ids = undecided(graph, [COREXY]).map((n) => n.id).sort();
  assert.deepEqual(ids, ['Controller', 'Drive type', 'Linear guide', 'Pen lift'].map(id).sort());
});

test('select: exclusion shown', () => {
  const { excluded } = analyze(graph, [COREXY]);
  assert.equal(excluded.get(LEADSCREW), COREXY);
});

test('select: missing requirement shown', () => {
  const { missing } = analyze(graph, [COREXY]);
  assert.deepEqual([...missing.keys()], [BELT]);
  assert.deepEqual(analyze(graph, [COREXY, BELT]).missing.size, 0);
});

test('select: one option per decision', () => {
  assert.deepEqual(toggle(graph, [COREXY], HBOT), [HBOT]);
  assert.deepEqual(toggle(graph, [COREXY], BELT), [COREXY, BELT]);
  assert.deepEqual(toggle(graph, [COREXY], COREXY), []);
});

test('select: conflict', () => {
  const { conflicts } = analyze(graph, [COREXY, LEADSCREW]);
  assert.equal(conflicts.length, 1);
  assert.deepEqual([...conflicts[0]].sort(), [LEADSCREW, COREXY]);
});

import { selectionKey, contentHash, buildPrompt } from '../viewer/brief.js';

const withBody = (id, body) => {
  const nodes = data.nodes.map((n) => (n.id === id ? { ...n, body } : n));
  return { nodes, byId: new Map(nodes.map((n) => [n.id, n])) };
};

test('brief: key ignores order, differs for another set', () => {
  assert.equal(selectionKey([COREXY, BELT]), selectionKey([BELT, COREXY]));
  assert.notEqual(selectionKey([COREXY]), selectionKey([COREXY, BELT]));
});

test('brief: content hash follows selected nodes only', () => {
  const pick = [COREXY];
  const base = contentHash(graph, pick);
  assert.notEqual(contentHash(withBody(COREXY, 'changed'), pick), base);
  assert.equal(contentHash(withBody(LEADSCREW, 'changed'), pick), base);
});

test('brief: prompt has body, missing requirement and undecided decisions', () => {
  const template = readFileSync(new URL('../prompts/brief.md', import.meta.url), 'utf8');
  const prompt = buildPrompt(template, graph, [COREXY]);
  assert.ok(prompt.includes(graph.byId.get(COREXY).body.trim()));
  assert.ok(prompt.includes('Missing requirement: ') && prompt.includes(`(${BELT})`));
  for (const d of undecided(graph, [COREXY])) assert.ok(prompt.includes(`(${d.id})`));
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
  const nodes = data.nodes.map((n) => (n.id === id('Drive type') ? { ...n, slot: undefined } : n));
  const src = buildDiagram({ nodes, byId: new Map(nodes.map((n) => [n.id, n])) }, []);
  assert.ok(subgraph(src, 'Other').includes('Drive'));
});

test('diagram: decided and undecided boxes', () => {
  const src = buildDiagram(graph, [COREXY]);
  assert.ok(src.includes('CoreXY'));
  assert.equal(src.split('undecided<').length - 1 + src.split('undecided"').length - 1, 4);
  assert.match(src, /class d\d(,d\d)+ undecided/);
});

test('diagram: requirement, missing and conflict edges', () => {
  const both = buildDiagram(graph, [COREXY, BELT]);
  assert.match(both, /d\d --> d\d/);
  assert.ok(!both.includes('needs') && !both.includes('excludes'));
  const missing = buildDiagram(graph, [COREXY]);
  assert.match(missing, /d\d -\.->\|"needs GT2 belt[^"]*"\| d\d/);
  const conflict = buildDiagram(graph, [COREXY, LEADSCREW]);
  assert.match(conflict, /d\d ---\|"excludes"\| d\d/);
  assert.match(conflict, /linkStyle \d .*stroke-dasharray/);
});

test('diagram: titles cannot alter the source', () => {
  const evil = 'A "q" [b] <script>x</script> | #';
  const nodes = data.nodes.map((n) => (n.id === COREXY ? { ...n, title: evil } : n));
  const src = buildDiagram({ nodes, byId: new Map(nodes.map((n) => [n.id, n])) }, [COREXY]);
  assert.ok(!src.includes('<script>') && !src.includes('A "q"'));
  assert.ok(src.includes('A #quot;q#quot; #91;b#93; #lt;script#gt;x#lt;/script#gt; #124; #35;'));
});

import { outlineRows, badges } from '../viewer/outline.js';

test('hash: up and down parse, validate and build', () => {
  const r = parseHash('#/graph?up=1&down=20', known);
  assert.deepEqual([r.up, r.down], [1, 20]);
  for (const bad of ['abc', '-2', '99', '']) {
    const b = parseHash(`#/graph?up=${bad}&down=${bad}`, known);
    assert.deepEqual([b.up, b.down], [3, 2], bad);
  }
  assert.equal(buildHash('graph', { view: 'x', up: 3, down: 2 }), '#/graph?view=x');
  assert.equal(buildHash('graph', { view: 'x', up: 1, down: 4 }), '#/graph?view=x&up=1&down=4');
  assert.equal(buildHash('graph', { pick: ['a'], view: 'x' }), '#/graph?pick=a&view=x');
});

// Hand-built graph: root > A, B; A > C, D; B > D; C > E > F > G (deep chain); D has two parents.
function mini(spec) {
  const nodes = Object.entries(spec).map(([id, parents]) => ({ id, title: id.toUpperCase(), parents, children: [] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) for (const p of n.parents) byId.get(p).children.push(n.id);
  return { nodes, byId, rootId: 'root' };
}
const shape = (rows) => rows.map((r) => (r.kind === 'more' ? `${r.side}+${r.hidden}@${r.level}` : `${r.id}${r.repeat ? '*' : ''}@${r.level}`));
const g = mini({ root: [], a: ['root'], b: ['root'], c: ['a'], d: ['a', 'b'], e: ['c'], f: ['e'], g: ['f'] });

test('outline: root focus lists descendants and no ancestors', () => {
  assert.deepEqual(shape(outlineRows(g, 'root')), ['root@0', 'a@1', 'c@2', 'down+3@3', 'd@2', 'b@1', 'd*@2']);
});

test('outline: two parents, first parent adjacent, each with its own ancestors above', () => {
  assert.deepEqual(shape(outlineRows(g, 'd')), ['root*@2', 'b@1', 'root@2', 'a@1', 'd@0']);
});

test('outline: shared node repeated without relatives', () => {
  const rows = outlineRows(g, 'root', { down: 3 });
  assert.deepEqual(shape(rows), ['root@0', 'a@1', 'c@2', 'e@3', 'down+2@4', 'd@2', 'b@1', 'd*@2']);
});

test('outline: depth cut with hidden counts, both sides', () => {
  assert.deepEqual(shape(outlineRows(g, 'e', { up: 1, down: 1 })), ['up+2@2', 'c@1', 'e@0', 'f@1', 'down+1@2']);
  assert.deepEqual(shape(outlineRows(g, 'e', { up: 0, down: 0 })), ['up+3@1', 'e@0', 'down+2@1']);
});

test('outline: no more row when nothing is hidden', () => {
  const rows = outlineRows(g, 'e', { up: 5, down: 5 });
  assert.deepEqual(shape(rows), ['root@3', 'a@2', 'c@1', 'e@0', 'f@1', 'g@2']);
});

test('outline: parent fallback', () => {
  const legacy = { rootId: 'r', byId: new Map([['r', { id: 'r', children: ['x'] }], ['x', { id: 'x', parent: 'r', children: [] }]]) };
  assert.deepEqual(shape(outlineRows(legacy, 'x')), ['r@1', 'x@0']);
});

test('outline: link badges', () => {
  const gg = { byId: new Map([['t', { title: 'T' }], ['u', { title: 'U' }]]) };
  assert.deepEqual(badges(gg, { requires: ['t'], excludes: [], compatible_with: ['u'] }), [
    { kind: 'requires', id: 't', title: 'T' }, { kind: 'compatible with', id: 'u', title: 'U' },
  ]);
  assert.deepEqual(badges(gg, {}), []);
});
