import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { outlineRows, crossLinks } from '../viewer/outline.js';
import { toggle, analyze, undecided, decisions } from '../viewer/select.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])) };
const known = new Set(graph.byId.keys());
const id = idByTitle(data.nodes);
const COREXY = id('CoreXY');
const CANTILEVER = id('Single-rail cantilever');
const CARTESIAN = id('Cartesian, two Y rails');
const BELT = id('GT2 belt drive');
const LEADSCREW = id('Leadscrew drive');
const MOVE = id('Move the pen in XY');
const TRANSMIT = id('Transmit motor motion');
const HBOT = CANTILEVER;

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

const DECISIONS = ['Move the pen in XY', 'Keep the gantry square', 'Transmit motor motion', 'Guide the axes', 'Lift and lower the pen', 'Turn G-code into motion'];

test('select: decisions are the functions whose how targets are solutions', () => {
  assert.deepEqual(decisions(graph).map((n) => n.id).sort(), DECISIONS.map(id).sort());
});

test('select: undecided functions', () => {
  assert.deepEqual(undecided(graph, []).map((n) => n.id).sort(), DECISIONS.map(id).sort());
  const ids = undecided(graph, [COREXY]).map((n) => n.id).sort();
  assert.deepEqual(ids, DECISIONS.filter((t) => t !== 'Move the pen in XY').map(id).sort());
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

test('select: one solution per function', () => {
  assert.deepEqual(toggle(graph, [COREXY], CANTILEVER), [CANTILEVER]);
  assert.deepEqual(toggle(graph, [COREXY], CARTESIAN), [CARTESIAN]);
  assert.deepEqual(toggle(graph, [COREXY], BELT), [COREXY, BELT]);
  assert.deepEqual(toggle(graph, [COREXY], COREXY), []);
});

test('select: conflict', () => {
  const { conflicts } = analyze(graph, [COREXY, LEADSCREW]);
  assert.equal(conflicts.length, 1);
  assert.deepEqual([...conflicts[0]].sort(), [LEADSCREW, COREXY].sort());
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

test('brief: prompt has body, missing requirement and undecided functions', () => {
  const template = readFileSync(new URL('../prompts/brief.md', import.meta.url), 'utf8');
  const prompt = buildPrompt(template, graph, [COREXY]);
  assert.ok(prompt.includes(graph.byId.get(COREXY).body.trim()));
  assert.ok(prompt.includes('Missing requirement: ') && prompt.includes(`(${BELT})`));
  for (const d of undecided(graph, [COREXY])) assert.ok(prompt.includes(`(${d.id})`));
  assert.ok(!prompt.includes('{{') && !prompt.includes('version:'));
});


test('links: requires keeps direction, symmetric kinds are listed once per pair', () => {
  const nodes = ['a', 'b'].map((id) => ({ id, how: [], requires: [], excludes: [], compatible_with: [] }));
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

test('outline: preorder over how from the root, depths 0..2, then constraints', () => {
  const rows = outlineRows({ ...graph, rootId: data.root });
  assert.equal(new Set(rows.map((r) => r.id)).size, data.nodes.length);
  assert.deepEqual([rows[0].id, rows[0].depth], [data.root, 0]);
  const at = rows.findIndex((r) => r.id === MOVE);
  assert.equal(rows[at].depth, 1);
  assert.deepEqual(rows.slice(at + 1, at + 2).map((r) => r.id), [graph.byId.get(MOVE).how[0]]);
  assert.equal(rows[at + 1].depth, 2);
  assert.ok(rows.every((r) => r.depth <= 5));
  const constraints = data.nodes.filter((n) => n.type === 'constraint').map((n) => n.id);
  assert.deepEqual(rows.slice(-constraints.length).map((r) => r.id).sort(), constraints.sort());
  assert.ok(rows.slice(0, -constraints.length).every((r) => graph.byId.get(r.id).type !== 'constraint'));
});

test('outline: shared function repeated under each solution, children once', () => {
  const rows = outlineRows({ ...graph, rootId: data.root });
  const shared = rows.filter((r) => r.id === TRANSMIT);
  assert.equal(shared.length, graph.byId.get(TRANSMIT).why.length);
  assert.deepEqual(shared.map((r) => r.repeat), [false, true, true]);
  const belt = rows.filter((r) => r.id === BELT);
  assert.equal(belt.length, 1);
});

test('outline: repeat marks and children, on a small graph', () => {
  const nodes = [['root', ['a', 'b']], ['a', ['d']], ['b', ['d']], ['d', ['e']], ['e', []]]
    .map(([id, how]) => ({ id, how, type: 'function' }));
  const rows = outlineRows({ nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' });
  assert.deepEqual(rows.map((r) => `${r.id}${r.repeat ? '*' : ''}@${r.depth}`), ['root@0', 'a@1', 'd@2', 'e@3', 'b@1', 'd*@2']);
});

test('outline: children follow the how list as built, not the title order', () => {
  const nodes = [['root', ['z', 'a', 'm']], ['z', []], ['a', []], ['m', []]]
    .map(([id, how]) => ({ id, how, type: 'function', title: id }));
  const rows = outlineRows({ nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' });
  assert.deepEqual(rows.map((r) => r.id), ['root', 'z', 'a', 'm']);
});

test('demo graph: the main function lists move, lift, then G-code, and gantry solutions bring the guide', () => {
  const titles = (id) => graph.byId.get(id).how.map((c) => graph.byId.get(c).title);
  assert.deepEqual(titles(data.root), ['Move the pen in XY', 'Lift and lower the pen', 'Turn G-code into motion']);
  const guide = data.nodes.find((n) => n.title === 'Guide the axes');
  assert.equal(guide.why.length, 3);
  assert.ok(guide.why.every((w) => graph.byId.get(w).type === 'solution'));
});
