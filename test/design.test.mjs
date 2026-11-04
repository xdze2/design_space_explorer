import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emptyDesign, entryOf, clean, decisions, isEmpty, choose, unchoose, shortlist, unshortlist, reject, unreject,
  setNotes, setConstraint, setName, setIntent, analyzeDesign, chipState, whatIf, whyPath,
} from '../viewer/design.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])), rootId: data.root };
const id = idByTitle(data.nodes);
const MOVE = id('Move the pen in XY');
const LIFT = id('Lift and lower the pen');
const GCODE = id('Turn G-code into motion');
const TRANSMIT = id('Transmit motor motion');
const GUIDE = id('Guide the axes');
const SQUARE = id('Keep the gantry square');
const COREXY = id('CoreXY');
const CARTESIAN = id('Cartesian, two Y rails');
const CANTILEVER = id('Single-rail cantilever');
const BELT = id('GT2 belt drive');
const LEADSCREW = id('Leadscrew drive');
const SOLENOID = id('Solenoid pen lift');
const FLUIDNC = id('FluidNC on ESP32');
const GRBL = id('GRBL on Arduino Uno with CNC shield');
const PAPER = id('Paper format');
const ROD = id('Stiff cross rod');
const SERVO = id('Servo pen lift');

const fresh = () => emptyDesign();
const withCorexy = () => choose(graph, fresh(), MOVE, COREXY);

test('design: a new design has no entries and an unknown function reads as open', () => {
  const d = fresh();
  assert.match(d.id, /^d-[0-9a-f]{8}$/);
  assert.deepEqual([d.name, d.intent, d.constraints, d.functions], ['Untitled design', '', {}, {}]);
  assert.notEqual(emptyDesign().id, d.id);
  assert.deepEqual(entryOf(d, MOVE), { status: 'open', choice: null, shortlist: [], rejected: [], notes: '' });
  assert.ok(isEmpty(d));
});

test('design: decisions are the functions whose how targets are solutions', () => {
  const titles = ['Move the pen in XY', 'Keep the gantry square', 'Transmit motor motion', 'Guide the axes', 'Lift and lower the pen', 'Turn G-code into motion'];
  assert.deepEqual(decisions(graph).map((n) => n.id).sort(), titles.map(id).sort());
});

test('clean: rejects what is not a design', () => {
  assert.throws(() => clean(graph, 'text'), /JSON object/);
  assert.throws(() => clean(graph, []), /JSON object/);
  assert.throws(() => clean(graph, { id: 'x' }), /functions/);
  assert.throws(() => clean(graph, { functions: [] }), /functions/);
});

test('clean: a choice under the wrong function is dropped with a notice', () => {
  const { design, dropped } = clean(graph, { functions: { [LIFT]: { choice: COREXY } } });
  assert.deepEqual(design.functions, {});
  assert.equal(dropped.length, 1);
  assert.ok(dropped[0].includes(COREXY) && dropped[0].includes('CoreXY'));
});

test('clean: unknown ids and invalid entries are dropped and named', () => {
  const raw = {
    id: 'a/b', name: '  Mine ', intent: ' go ',
    constraints: { [PAPER]: 'A4', nope1: 'x', [MOVE]: 'not a constraint', [id('Budget')]: 12 },
    functions: {
      nope2: { choice: COREXY },
      [MOVE]: {
        choice: COREXY, shortlist: [CARTESIAN, COREXY, CARTESIAN, 'zzz'],
        rejected: [{ id: CANTILEVER, reason: ' heavy ' }, { id: CARTESIAN, reason: 'no' }, { id: COREXY, reason: 'no' }, { id: CANTILEVER, reason: 'dup' }, { id: 'q', reason: 'x' }],
        notes: ' hi ',
      },
      [LIFT]: { rejected: [{ id: SOLENOID, reason: '  ' }] },
      [GCODE]: 'oops',
    },
  };
  const { design, dropped } = clean(graph, raw);
  assert.equal(design.name, 'Mine');
  assert.equal(design.intent, 'go');
  assert.notEqual(design.id, 'a/b');
  assert.deepEqual(design.constraints, { [PAPER]: 'A4' });
  assert.deepEqual(design.functions, {
    [MOVE]: { status: 'decided', choice: COREXY, shortlist: [CARTESIAN], rejected: [{ id: CANTILEVER, reason: 'heavy' }], notes: 'hi' },
  });
  const text = dropped.join('\n');
  for (const needle of ['nope1', 'nope2', 'zzz', '"a/b"', 'no reason', 'chosen and rejected', 'shortlisted and rejected', GCODE]) {
    assert.ok(text.includes(needle), needle);
  }
});

test('clean: status is recomputed from choice and shortlist', () => {
  const { design } = clean(graph, { functions: { [MOVE]: { status: 'decided', shortlist: [COREXY] }, [LIFT]: { status: 'decided' } } });
  assert.equal(design.functions[MOVE].status, 'exploring');
  assert.equal(design.functions[LIFT], undefined);
});

test('action: choose', () => {
  const d = withCorexy();
  assert.deepEqual(d.functions[MOVE], { status: 'decided', choice: COREXY, shortlist: [], rejected: [], notes: '' });
});

test('action: replacing a choice puts the old one on the shortlist', () => {
  const d = choose(graph, withCorexy(), MOVE, CANTILEVER);
  assert.equal(d.functions[MOVE].choice, CANTILEVER);
  assert.deepEqual(d.functions[MOVE].shortlist, [COREXY]);
});

test('action: choosing removes the solution from shortlist and rejected', () => {
  let d = reject(graph, fresh(), MOVE, COREXY, 'meh');
  d = choose(graph, d, MOVE, COREXY);
  assert.deepEqual(d.functions[MOVE].rejected, []);
  d = choose(graph, shortlist(graph, fresh(), MOVE, COREXY), MOVE, COREXY);
  assert.deepEqual(d.functions[MOVE].shortlist, []);
});

test('action: shortlist while open makes the function exploring', () => {
  const d = shortlist(graph, fresh(), GCODE, FLUIDNC);
  assert.deepEqual(d.functions[GCODE], { status: 'exploring', choice: null, shortlist: [FLUIDNC], rejected: [], notes: '' });
  assert.equal(unshortlist(graph, d, GCODE, FLUIDNC).functions[GCODE], undefined);
});

test('action: unchoose', () => {
  assert.equal(unchoose(graph, withCorexy(), MOVE).functions[MOVE], undefined);
  const d = unchoose(graph, choose(graph, withCorexy(), MOVE, CANTILEVER), MOVE);
  assert.equal(d.functions[MOVE].status, 'exploring');
  assert.equal(d.functions[MOVE].choice, null);
});

test('action: reject needs a reason', () => {
  const d = fresh();
  for (const reason of ['', '   ', undefined]) assert.equal(reject(graph, d, LIFT, SOLENOID, reason), d);
  const r = reject(graph, d, LIFT, SOLENOID, ' too loud ');
  assert.deepEqual(r.functions[LIFT].rejected, [{ id: SOLENOID, reason: 'too loud' }]);
  assert.equal(unreject(graph, r, LIFT, SOLENOID).functions[LIFT], undefined);
});

test('action: rejecting the choice clears it', () => {
  const d = reject(graph, withCorexy(), MOVE, COREXY, 'no');
  assert.equal(d.functions[MOVE].choice, null);
  assert.equal(d.functions[MOVE].status, 'open');
});

test('action: solutions only under their own function; no-ops return the same document', () => {
  const d = fresh();
  assert.equal(choose(graph, d, LIFT, COREXY), d);
  assert.equal(shortlist(graph, d, MOVE, SERVO), d);
  assert.equal(unchoose(graph, d, MOVE), d);
  const c = withCorexy();
  assert.equal(choose(graph, c, MOVE, COREXY), c);
  assert.equal(shortlist(graph, c, MOVE, COREXY), c);
});

test('action: notes, constraints, name and intent', () => {
  let d = setNotes(graph, fresh(), MOVE, ' mind the A3 ');
  assert.equal(d.functions[MOVE].notes, 'mind the A3');
  assert.equal(setNotes(graph, d, MOVE, '').functions[MOVE], undefined);
  assert.equal(setNotes(graph, d, COREXY, 'x'), d);
  d = setConstraint(graph, d, PAPER, 'A4, sometimes A3');
  assert.equal(d.constraints[PAPER], 'A4, sometimes A3');
  assert.deepEqual(setConstraint(graph, d, PAPER, '').constraints, {});
  assert.equal(setConstraint(graph, d, MOVE, 'x'), d);
  assert.equal(setName(graph, d, ' Plotter ').name, 'Plotter');
  assert.equal(setName(graph, d, ' ').name, 'Untitled design');
  assert.equal(setIntent(graph, d, ' A3 plotter ').intent, 'A3 plotter');
});

test('analysis: CoreXY excludes the leadscrew and requires the belt', () => {
  const a = analyzeDesign(graph, withCorexy());
  assert.equal(a.excluded.get(LEADSCREW), COREXY);
  assert.deepEqual(a.required.get(BELT), [COREXY]);
  assert.deepEqual(chipState(a, withCorexy(), TRANSMIT, LEADSCREW), { state: 'excluded', cause: [COREXY], conflict: false });
  assert.deepEqual(chipState(a, withCorexy(), TRANSMIT, BELT), { state: 'required', cause: [COREXY], conflict: false });
  assert.equal(chipState(a, withCorexy(), MOVE, COREXY).state, 'chosen');
  assert.equal(chipState(a, withCorexy(), MOVE, CARTESIAN).state, 'open');
});

test('analysis: chip states by priority', () => {
  let d = shortlist(graph, withCorexy(), GCODE, FLUIDNC);
  d = reject(graph, d, GCODE, GRBL, 'old');
  const a = analyzeDesign(graph, d);
  assert.equal(chipState(a, d, GCODE, FLUIDNC).state, 'shortlisted');
  const g = chipState(a, d, GCODE, GRBL);
  assert.deepEqual([g.state, g.reason], ['rejected', 'old']);
  // rejected wins over excluded
  const e = reject(graph, d, TRANSMIT, LEADSCREW, 'slow');
  assert.equal(chipState(analyzeDesign(graph, e), e, TRANSMIT, LEADSCREW).state, 'rejected');
});

test('analysis: choosing an excluded solution is allowed and is a conflict', () => {
  let d = withCorexy();
  d = choose(graph, d, TRANSMIT, LEADSCREW);
  const a = analyzeDesign(graph, d);
  assert.equal(a.conflicts.length, 1);
  assert.deepEqual([...a.conflicts[0]].sort(), [COREXY, LEADSCREW].sort());
  const chip = chipState(a, d, TRANSMIT, LEADSCREW);
  assert.deepEqual([chip.state, chip.conflict], ['chosen', true]);
  assert.equal(a.problems, 2); // the conflict, and the missing belt
});

test('analysis: a dormant entry is kept and does not count, and comes back', () => {
  let d = choose(graph, fresh(), MOVE, CARTESIAN);
  d = choose(graph, d, SQUARE, ROD);
  let a = analyzeDesign(graph, d);
  assert.ok(a.active.has(SQUARE) && a.chosenSet.has(ROD));
  assert.deepEqual(a.required.get(BELT), [ROD]);
  d = choose(graph, d, MOVE, COREXY);
  a = analyzeDesign(graph, d);
  assert.ok(!a.active.has(SQUARE) && !a.chosenSet.has(ROD));
  assert.equal(d.functions[SQUARE].choice, ROD);
  assert.deepEqual(a.required.get(BELT), [COREXY]);
  d = choose(graph, d, MOVE, CARTESIAN);
  a = analyzeDesign(graph, d);
  assert.ok(a.active.has(SQUARE) && a.chosen.get(SQUARE) === ROD);
});

test('analysis: counts on the demo graph with only CoreXY chosen', () => {
  const a = analyzeDesign(graph, withCorexy());
  assert.equal(a.problems, 1);
  assert.deepEqual([...a.required.keys()], [BELT]);
  assert.deepEqual([...a.undecided].sort(), [LIFT, GCODE, TRANSMIT, GUIDE].sort());
  const empty = analyzeDesign(graph, fresh());
  assert.deepEqual([...empty.undecided].sort(), [MOVE, LIFT, GCODE].sort());
  assert.equal(empty.problems, 0);
});

test('what-if: replacing a choice', () => {
  const w = whatIf(graph, withCorexy(), CARTESIAN);
  assert.equal(w.fn, MOVE);
  assert.equal(w.replaces, COREXY);
  assert.deepEqual(w.activated, [SQUARE]);
  assert.deepEqual(w.dropped, [BELT]);
  assert.deepEqual([w.added, w.conflicts, w.deactivated], [[], [], []]);
});

test('what-if: a conflict, and a requirement it would add', () => {
  const w = whatIf(graph, withCorexy(), LEADSCREW);
  assert.deepEqual(w.conflicts, [COREXY]);
  const r = whatIf(graph, fresh(), COREXY);
  assert.deepEqual(r.added, [BELT]);
  assert.deepEqual(r.activated.sort(), [TRANSMIT, GUIDE].sort());
});

test('what-if: nothing for a solution that is already chosen; the design is not touched', () => {
  const d = withCorexy();
  const before = JSON.stringify(d);
  assert.equal(whatIf(graph, d, COREXY), null);
  whatIf(graph, d, CARTESIAN);
  assert.equal(JSON.stringify(d), before);
});

test('why path: through the chosen solution of a shared function', () => {
  const d = choose(graph, fresh(), MOVE, CANTILEVER);
  assert.deepEqual(whyPath(graph, analyzeDesign(graph, d), TRANSMIT), [data.root, MOVE, CANTILEVER]);
});

test('why path: first why when nothing is chosen, root has none, constraint ends at its function', () => {
  const a = analyzeDesign(graph, fresh());
  assert.deepEqual(whyPath(graph, a, COREXY), [data.root, MOVE]);
  assert.deepEqual(whyPath(graph, a, data.root), []);
  assert.deepEqual(whyPath(graph, a, TRANSMIT).slice(0, 2), [data.root, MOVE]);
  assert.deepEqual(whyPath(graph, a, PAPER).at(-1), graph.byId.get(PAPER).constrains[0]);
});
