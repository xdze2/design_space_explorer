import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { outlineRows, crossLinks } from '../viewer/outline.js';
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

test('hash: pick and view round trip', () => {
  const s = parseHash(`#/?pick=${COREXY},${BELT}&view=${HBOT}`, known);
  assert.deepEqual(s, { pick: [COREXY, BELT], view: HBOT, unknown: [] });
  assert.equal(buildHash({ pick: ['a/b', 'c/d'] }), '#/?pick=a/b,c/d');
  assert.equal(buildHash(), '#/');
  assert.equal(buildHash({ pick: ['x/y'], view: 'gantry/corexy' }), '#/?pick=x/y&view=gantry/corexy');
});

test('hash: old page links still read', () => {
  for (const h of ['', '#/nonsense', '#/design', '#/graph', '#/selection']) {
    assert.deepEqual(parseHash(h, known), { pick: [], view: null, unknown: [] }, h);
  }
  assert.deepEqual(parseHash(`#/design?pick=${COREXY}&view=${HBOT}`, known),
    { pick: [COREXY], view: HBOT, unknown: [] });
});

test('hash: obsolete parameters are ignored', () => {
  assert.deepEqual(parseHash('#/?layout=outline&up=1&down=2', known), { pick: [], view: null, unknown: [] });
  assert.equal(buildHash({ view: 'x' }), '#/?view=x');
});

test('hash: legacy browse links read as view', () => {
  assert.equal(parseHash(`#/browse/${COREXY}`, known).view, COREXY);
  const b = parseHash(`#/browse/${LEADSCREW}?pick=${COREXY}`, known);
  assert.deepEqual([b.view, b.pick], [LEADSCREW, [COREXY]]);
  assert.equal(parseHash('#/browse/root', known).view, null);
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual(b.unknown, ['gantry/doesnotexist']);
  assert.equal(b.view, null);
  const p = parseHash(`#/?pick=${COREXY},nope`, known);
  assert.deepEqual([p.pick, p.unknown], [[COREXY], ['nope']]);
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


const subgraph = (src, name) => src.split('\n').slice(src.split('\n').findIndex((l) => l.includes(`["${name}"]`) && l.includes('subgraph')))
  .join('\n').split('  end')[0];

test('links: requires keeps direction, symmetric kinds are listed once per pair', () => {
  const nodes = ['a', 'b'].map((id) => ({ id, children: [], requires: [], excludes: [], compatible_with: [] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  byId.get('a').compatible_with.push('b');
  byId.get('b').compatible_with.push('a');
  byId.get('a').requires.push('b');
  byId.get('b').requires.push('a');
  byId.get('a').excludes.push('b');
  byId.get('b').excludes.push('a');
  const links = crossLinks({ nodes, byId });
  assert.deepEqual(links.map((l) => l.type).sort(), ['compatible_with', 'excludes', 'requires', 'requires']);
});

test('outline: preorder from the root, one row per node, depth 0..2', () => {
  const root = data.nodes.find((n) => n.type === 'root');
  const rows = outlineRows({ ...graph, rootId: root.id });
  assert.equal(rows.length, data.nodes.length);
  assert.deepEqual([rows[0].id, rows[0].depth], [root.id, 0]);
  const at = rows.findIndex((r) => r.id === GANTRY);
  assert.equal(rows[at].depth, 1);
  assert.deepEqual(rows.slice(at + 1, at + 5).map((r) => r.id), graph.byId.get(GANTRY).children);
  assert.ok(rows.slice(at + 1, at + 5).every((r) => r.depth === 2));
});

test('outline: shared node repeated once without its children', () => {
  const nodes = [['root', ['a', 'b']], ['a', ['d']], ['b', ['d']], ['d', ['e']], ['e', []]]
    .map(([id, children]) => ({ id, children }));
  const rows = outlineRows({ nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' });
  assert.deepEqual(rows.map((r) => `${r.id}${r.repeat ? '*' : ''}@${r.depth}`), ['root@0', 'a@1', 'd@2', 'e@3', 'b@1', 'd*@2']);
});
