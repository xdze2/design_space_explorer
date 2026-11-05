import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderMarkdown } from '../viewer/markdown.js';
import { parseHash, buildHash } from '../viewer/hash.js';
import { visibleRows, togglePeek, toggleFold } from '../viewer/outline.js';
import { emptyDesign, choose, reject, shortlist, setNotes, setIntent, analyzeDesign } from '../viewer/design.js';
import { designKey, contentHash, buildPrompt } from '../viewer/brief.js';
import { abbreviation, tileLabel, badges } from '../viewer/card.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../topics/pen_plotter/graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])), rootId: data.root };
const known = new Set(graph.byId.keys());
const id = idByTitle(data.nodes);
const COREXY = id('CoreXY');
const CANTILEVER = id('Single-rail cantilever');
const CARTESIAN = id('Cartesian, two Y rails');
const BELT = id('GT2 belt drive');
const LEADSCREW = id('Leadscrew drive');
const MOVE = id('Move the pen in XY');
const LIFT = id('Lift and lower the pen');
const GCODE = id('Turn drawing commands into motion');
const TRANSMIT = id('Transmit motor motion');
const GUIDE = id('Guide the axes');
const SQUARE = id('Keep the gantry square');
const SERVO = id('Servo pen lift');
const SOLENOID = id('Solenoid pen lift');
const MICRO = id('Micro servo');
const HOLDER = id('Spring-loaded 3D-printed pen holder');
const PAPER = id('Paper format');
const BUDGET = id('Budget');
const PRESSURE = id('Set the pen pressure');
const SPRING = id('Spring against a hard stop');

test('markdown: paragraphs, bold, code, lists', () => {
  const html = renderMarkdown('**Hi** `x`\n\n- a\n- b');
  assert.equal(html, '<p><strong>Hi</strong> <code>x</code></p>\n<ul><li>a</li><li>b</li></ul>');
});

test('markdown: HTML is escaped', () => {
  const html = renderMarkdown('<script>alert(1)</script> **b**');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

const NONE = { view: null, fold: [], peek: [], unknown: [], pickIgnored: false };

test('hash: view, fold and peek round trip', () => {
  const h = `#/?view=${BELT}&fold=${LIFT},${MOVE}&peek=${COREXY}`;
  assert.deepEqual(parseHash(h, known), { ...NONE, view: BELT, fold: [LIFT, MOVE], peek: [COREXY] });
  assert.equal(buildHash({ view: BELT, fold: [LIFT, MOVE], peek: [COREXY] }), h);
  assert.equal(buildHash(), '#/');
  assert.equal(buildHash({ peek: ['a/b'] }), '#/?peek=a/b');
});

test('hash: old page links still read', () => {
  for (const h of ['', '#/nonsense', '#/design', '#/graph', '#/selection']) {
    assert.deepEqual(parseHash(h, known), NONE, h);
  }
  assert.equal(parseHash(`#/design?view=${COREXY}`, known).view, COREXY);
});

test('hash: obsolete parameters are ignored', () => {
  assert.deepEqual(parseHash('#/?layout=outline&up=1&down=2', known), NONE);
});

test('hash: legacy browse links read as view', () => {
  assert.equal(parseHash(`#/browse/${COREXY}`, known).view, COREXY);
  assert.equal(parseHash(`#/browse/${LEADSCREW}?pick=${COREXY}`, known).view, LEADSCREW);
  assert.equal(parseHash('#/browse/root', known).view, null);
});

test('hash: an old pick link is ignored with a flag', () => {
  const s = parseHash(`#/?pick=${COREXY},${BELT}&view=${MOVE}`, known);
  assert.deepEqual(s, { ...NONE, view: MOVE, pickIgnored: true });
  assert.equal(parseHash(`#/?pick=${COREXY}`, known).pickIgnored, true);
});

test('hash: unknown ids are dropped and reported', () => {
  const b = parseHash('#/browse/gantry/doesnotexist', known);
  assert.deepEqual([b.unknown, b.view], [['gantry/doesnotexist'], null]);
  const p = parseHash(`#/?view=nope&fold=${MOVE},nope2&peek=nope3`, known);
  assert.deepEqual([p.fold, p.peek, p.unknown], [[MOVE], [], ['nope', 'nope2', 'nope3']]);
});

// Rows as text: indent by depth, `*` repeat, `~` dormant, `-n` folded with n hidden lines.
const rowsOf = (design, route = {}) => {
  const rows = visibleRows(graph, design, analyzeDesign(graph, design), route);
  return rows.map((r) => `${'  '.repeat(r.depth)}${graph.byId.get(r.id).title}${r.repeat ? '*' : ''}${r.dormant ? '~' : ''}${r.folded ? `-${r.hidden}` : ''}`);
};
const rowsFor = (design, route) => visibleRows(graph, design, analyzeDesign(graph, design), route);
const titles = (rows) => rows.map((r) => graph.byId.get(r.id).title);

test('outline: nothing chosen lists the root, its four functions and the constraints', () => {
  const rows = rowsFor(emptyDesign());
  const t = titles(rows);
  assert.deepEqual(t.slice(0, 5), ['Draw a design with a pen or brush', 'Move the pen in XY', 'Lift and lower the pen', 'Change pens', 'Turn drawing commands into motion']);
  assert.deepEqual(rows.slice(0, 5).map((r) => r.depth), [0, 1, 1, 1, 1]);
  const constraints = data.nodes.filter((n) => n.type === 'constraint').map((n) => n.id);
  assert.deepEqual(rows.slice(5).map((r) => r.id).sort(), constraints.sort());
  assert.ok(rows.slice(5).every((r) => r.kind === 'constraint' && r.depth === 0));
  // solutions are chips on the function row, in the author's order
  assert.deepEqual(rows[1].solutions.map((s) => graph.byId.get(s).title), ['Cartesian, two Y rails', 'CoreXY', 'H-bot', 'Single-rail cantilever', 'Hanging polargraph', 'Five-bar arm (SCARA)', 'Grit-wheel paper feed']);
});

test('outline: a chosen solution expands', () => {
  const d = choose(graph, emptyDesign(), MOVE, CARTESIAN);
  const rows = rowsFor(d);
  const at = rows.findIndex((r) => r.id === MOVE);
  assert.deepEqual(rows.slice(at + 1, at + 6).map((r) => [graph.byId.get(r.id).title, r.depth, r.dormant]),
    [['Drive the axes', 2, false], ['Transmit motor motion', 2, false], ['Guide the axes', 2, false], ['Keep the gantry square', 2, false], ['Hold the drawing surface', 2, false]]);
  assert.equal(rows.find((r) => r.id === TRANSMIT).depth, 2);
});

test('outline: components of a choice are listed under the function', () => {
  const d = choose(graph, choose(graph, emptyDesign(), LIFT, SERVO), PRESSURE, SPRING);
  const rows = rowsFor(d);
  const at = rows.findIndex((r) => r.id === LIFT);
  assert.deepEqual(rows.slice(at + 1, at + 4).map((r) => [r.id, r.depth]), [[PRESSURE, 2], [HOLDER, 3], [MICRO, 2]]);
  assert.deepEqual([HOLDER, MICRO].map((c) => rows.find((r) => r.id === c).kind), ['component', 'component']);
});

test('outline: rejecting or shortlisting lists nothing new', () => {
  let d = reject(graph, emptyDesign(), LIFT, SOLENOID, 'loud');
  d = shortlist(graph, d, LIFT, SERVO);
  assert.equal(rowsFor(d).length, rowsFor(emptyDesign()).length);
});

test('outline: peek lists a dormant subtree, one peek per function, unpeek hides it', () => {
  const d = emptyDesign();
  assert.deepEqual(rowsOf(d, { peek: [COREXY] }).slice(1, 7), ['  Move the pen in XY', '    Drive the axes~', '    Transmit motor motion~', '    Guide the axes~', '    Hold the drawing surface~', '  Lift and lower the pen']);
  assert.deepEqual(rowsOf(d, { peek: [COREXY, CARTESIAN] }).slice(1, 8),
    ['  Move the pen in XY', '    Drive the axes~', '    Transmit motor motion~', '    Guide the axes~', '    Keep the gantry square~', '    Hold the drawing surface~', '  Lift and lower the pen']);
  assert.equal(rowsOf(d, { peek: [] }).length, rowsOf(d).length);
  assert.deepEqual(togglePeek(graph, [COREXY], MOVE, CARTESIAN), [CARTESIAN]);
  assert.deepEqual(togglePeek(graph, [COREXY], MOVE, COREXY), []);
  assert.deepEqual(togglePeek(graph, [SERVO], MOVE, COREXY), [SERVO, COREXY]);
});

test('outline: peeking the chosen solution does nothing; a peek lists beside the choice', () => {
  const d = choose(graph, emptyDesign(), MOVE, CARTESIAN);
  assert.deepEqual(rowsOf(d, { peek: [CARTESIAN] }), rowsOf(d));
  const both = rowsOf(d, { peek: [COREXY] });
  assert.equal(both.filter((r) => r.startsWith('    Transmit motor motion')).length, 2);
  assert.ok(both.some((r) => r === '    Transmit motor motion*~'));
});

test('outline: collapse hides the lines below and counts them', () => {
  const d = choose(graph, emptyDesign(), MOVE, CARTESIAN);
  const rows = rowsFor(d, { fold: [MOVE] });
  const move = rows.find((r) => r.id === MOVE);
  assert.deepEqual([move.folded, move.hidden, move.foldable], [true, 5, true]);
  assert.ok(!rows.some((r) => r.id === TRANSMIT));
  assert.equal(rowsFor(d).find((r) => r.id === MOVE).foldable, true);
  assert.equal(rowsFor(d).find((r) => r.id === GCODE).foldable, false);
  assert.deepEqual(toggleFold([MOVE], MOVE), []);
  assert.deepEqual(toggleFold([], MOVE), [MOVE]);
});

test('outline: the open node is shown even when hidden, without touching fold / peek', () => {
  const d = emptyDesign();
  const rows = rowsFor(d, { view: SQUARE });
  const at = rows.findIndex((r) => r.id === SQUARE);
  assert.ok(at > 0);
  assert.deepEqual([rows[at].depth, rows[at].dormant], [2, true]);
  assert.equal(rows[at - 1].dormant && rows[at - 1].depth === 2 || rows[at - 1].id === MOVE, true);
  // under a folded line too
  const folded = rowsFor(choose(graph, d, MOVE, CARTESIAN), { view: SQUARE, fold: [MOVE] });
  assert.ok(folded.some((r) => r.id === SQUARE));
  assert.equal(folded.find((r) => r.id === MOVE).folded, false);
  // no view, no extra lines
  assert.ok(!rowsFor(d).some((r) => r.id === SQUARE));
});

test('outline: a shared function is repeated, its children listed once', () => {
  const nodes = [['root', ['a', 'b']], ['a', ['d']], ['b', ['d']], ['d', ['e']], ['e', []]]
    .map(([nid, how]) => ({ id: nid, how, type: 'function', title: nid }));
  const g = { nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' };
  const rows = visibleRows(g, emptyDesign(), analyzeDesign(g, emptyDesign()));
  assert.deepEqual(rows.map((r) => `${r.id}${r.repeat ? '*' : ''}@${r.depth}`), ['root@0', 'a@1', 'd@2', 'e@3', 'b@1', 'd*@2']);
});

test('outline: a folded subtree does not make later lines repeats', () => {
  const nodes = [['root', ['a', 'b']], ['a', ['d']], ['b', ['d']], ['d', ['e']], ['e', []]]
    .map(([nid, how]) => ({ id: nid, how, type: 'function', title: nid }));
  const g = { nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' };
  const rows = visibleRows(g, emptyDesign(), analyzeDesign(g, emptyDesign()), { fold: ['a'] });
  assert.deepEqual(rows.map((r) => `${r.id}${r.repeat ? '*' : ''}${r.folded ? `-${r.hidden}` : ''}`), ['root', 'a-2', 'b', 'd', 'e']);
});

test('outline: functions under a function follow the how list as built, not the title order', () => {
  const nodes = [['root', ['z', 'a', 'm']], ['z', []], ['a', []], ['m', []]]
    .map(([nid, how]) => ({ id: nid, how, type: 'function', title: nid }));
  const g = { nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: 'root' };
  assert.deepEqual(visibleRows(g, emptyDesign(), analyzeDesign(g, emptyDesign())).map((r) => r.id), ['root', 'z', 'a', 'm']);
});

test('demo graph: the main function lists move, lift, pens, then commands, and gantry solutions bring the guide', () => {
  const t = (nid) => graph.byId.get(nid).how.map((c) => graph.byId.get(c).title);
  assert.deepEqual(t(data.root), ['Move the pen in XY', 'Lift and lower the pen', 'Change pens', 'Turn drawing commands into motion']);
  const guide = data.nodes.find((n) => n.title === 'Guide the axes');
  assert.equal(guide.why.length, 5);
  assert.ok(guide.why.every((w) => graph.byId.get(w).type === 'solution'));
});

const withBody = (nid, body) => {
  const nodes = data.nodes.map((n) => (n.id === nid ? { ...n, body } : n));
  return { nodes, byId: new Map(nodes.map((n) => [n.id, n])), rootId: data.root };
};
const template = readFileSync(new URL('../prompts/brief.md', import.meta.url), 'utf8');

test('brief: the key is the design id and survives edits', () => {
  const d = emptyDesign();
  assert.equal(designKey(d), d.id);
  assert.equal(designKey(choose(graph, d, MOVE, COREXY)), d.id);
  assert.notEqual(designKey(emptyDesign()), d.id);
});

test('brief: content hash follows the design and the chosen nodes, not the id', () => {
  const d = choose(graph, emptyDesign(), MOVE, COREXY);
  const base = contentHash(graph, d);
  assert.equal(contentHash(graph, { ...d, id: 'd-other' }), base);
  assert.notEqual(contentHash(graph, choose(graph, d, TRANSMIT, BELT)), base);
  assert.notEqual(contentHash(graph, setNotes(graph, d, MOVE, 'x')), base);
  assert.notEqual(contentHash(graph, setIntent(graph, d, 'A3')), base);
  assert.notEqual(contentHash(withBody(COREXY, 'changed'), d), base);
  assert.equal(contentHash(withBody(LEADSCREW, 'changed'), d), base);
});

test('brief: prompt has the chosen body, the rejection with its reason, the missing requirement and the undecided functions', () => {
  let d = choose(graph, emptyDesign(), MOVE, COREXY);
  d = reject(graph, d, LIFT, SOLENOID, 'too loud');
  d = shortlist(graph, d, GCODE, id('FluidNC on ESP32'));
  d = setNotes(graph, d, MOVE, 'A3 is the goal');
  d = { ...d, intent: 'A big quiet plotter', constraints: { [PAPER]: 'A4, sometimes A3' } };
  const prompt = buildPrompt(template, graph, d);
  assert.ok(prompt.includes(graph.byId.get(COREXY).body.trim()));
  assert.ok(prompt.includes('Missing requirement: ') && prompt.includes(`(${BELT})`));
  assert.ok(prompt.includes('too loud') && prompt.includes('Solenoid pen lift'));
  assert.ok(prompt.includes('FluidNC on ESP32') && prompt.includes('A3 is the goal'));
  assert.ok(prompt.includes('A big quiet plotter') && prompt.includes('A4, sometimes A3'));
  for (const f of analyzeDesign(graph, d).undecided) assert.ok(prompt.includes(`(${f})`));
  assert.ok(!prompt.includes('{{') && !prompt.includes('version:'));
});

test('brief: prompt notes a conflict and an entry that is not in the design any more', () => {
  let d = choose(graph, emptyDesign(), MOVE, COREXY);
  d = choose(graph, d, TRANSMIT, LEADSCREW);
  assert.match(buildPrompt(template, graph, d), /Conflict: /);
  d = setNotes(graph, choose(graph, emptyDesign(), MOVE, CARTESIAN), SQUARE, 'dormant note');
  d = choose(graph, d, MOVE, CANTILEVER);
  assert.match(buildPrompt(template, graph, d), /dormant note|not part of the current design/);
  assert.match(buildPrompt(template, graph, d), /\[not part of the current design\]/);
});

test('card: derived abbreviations and the abbr override', () => {
  assert.equal(abbreviation('NEMA 17 steppers'), 'N17S');
  assert.equal(abbreviation('Linear rails and bearing blocks'), 'LRBB');
  assert.equal(abbreviation('CoreXY'), 'CO');
  assert.equal(abbreviation('Spring-loaded 3D-printed pen holder'), 'SL3D');
  assert.equal(tileLabel({ title: 'GT2 belt drive', abbr: 'GT2' }), 'GT2');
  assert.equal(tileLabel({ title: 'GT2 belt drive' }), 'GT2B');
});

test('card: badges are ordered by score then title, with marks and words', () => {
  const g = { byId: new Map([['k1', { title: 'Budget' }], ['k2', { title: 'Drawing speed' }], ['k3', { title: 'Line quality' }], ['k4', { title: 'Accuracy' }]]) };
  const node = { fares: [{ id: 'k1', score: -1 }, { id: 'k3', score: 1 }, { id: 'k2', score: 2 }, { id: 'k4', score: 1 }, { id: 'gone', score: 2 }] };
  const out = badges(g, node);
  assert.deepEqual(out.map((b) => `${b.mark} ${b.title}`), ['++ Drawing speed', '+ Accuracy', '+ Line quality', '− Budget']);
  assert.equal(out[0].words, 'much better on');
  assert.deepEqual(badges(g, {}), []);
  assert.deepEqual(badges(g, { fares: [{ id: 'k1', score: -2 }] }).map((b) => b.mark), ['−−']);
});
