import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createStore, fileName, serialize, STORAGE_KEY } from '../viewer/store.js';
import { emptyDesign, setName } from '../viewer/design.js';
import { idByTitle } from './helpers.mjs';

const data = JSON.parse(readFileSync(new URL('../graph.json', import.meta.url)));
const graph = { nodes: data.nodes, byId: new Map(data.nodes.map((n) => [n.id, n])), rootId: data.root };
const id = idByTitle(data.nodes);
const MOVE = id('Move the pen in XY');
const TRANSMIT = id('Transmit motor motion');
const COREXY = id('CoreXY');
const BELT = id('GT2 belt drive');

const fakeStorage = () => {
  const map = new Map();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};
const throwing = () => ({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });

test('store: a first visit gets a new design and no notice', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  assert.deepEqual(s.design.functions, {});
  assert.deepEqual(s.notices, []);
  assert.equal(s.canUndo, false);
});

test('store: reload round trip', () => {
  const storage = fakeStorage();
  const a = createStore(graph, { storage });
  a.act.choose(MOVE, COREXY);
  a.act.setNotes(MOVE, 'mind the A3');
  const b = createStore(graph, { storage });
  assert.deepEqual(b.design, a.design);
  assert.equal(b.design.functions[MOVE].notes, 'mind the A3');
  assert.equal(b.canUndo, false);
  assert.deepEqual(b.notices, []);
});

test('store: storage that throws still works, with a notice', () => {
  const s = createStore(graph, { storage: throwing() });
  assert.equal(s.notices.length, 1);
  assert.match(s.notices[0].text, /will not be kept/);
  s.act.choose(MOVE, COREXY);
  assert.equal(s.design.functions[MOVE].choice, COREXY);
  assert.equal(s.persistent, false);
  const none = createStore(graph, { storage: null });
  assert.equal(none.notices.length, 1);
});

test('store: storage that fails on save gives one notice and keeps working', () => {
  const storage = { getItem: () => null, setItem() { throw new Error('quota'); } };
  const s = createStore(graph, { storage });
  s.act.choose(MOVE, COREXY);
  s.act.choose(TRANSMIT, BELT);
  assert.equal(s.notices.length, 1);
  assert.equal(s.design.functions[TRANSMIT].choice, BELT);
});

test('store: unreadable or partly stale saved value gives a notice', () => {
  const bad = fakeStorage();
  bad.map.set(STORAGE_KEY, '{nope');
  const a = createStore(graph, { storage: bad });
  assert.match(a.notices[0].text, /could not be read/);
  assert.deepEqual(a.design.functions, {});
  const stale = fakeStorage();
  stale.map.set(STORAGE_KEY, JSON.stringify({ id: 'd-1', functions: { gone1: { choice: 'x' }, [MOVE]: { choice: COREXY } } }));
  const b = createStore(graph, { storage: stale });
  assert.match(b.notices[0].text, /gone1/);
  assert.equal(b.design.functions[MOVE].choice, COREXY);
});

test('store: undo two choices, undo is saved, no-op actions leave no undo step', () => {
  const storage = fakeStorage();
  const s = createStore(graph, { storage });
  s.act.choose(MOVE, COREXY);
  s.act.choose(MOVE, COREXY);
  s.act.choose(TRANSMIT, BELT);
  assert.equal(s.undo(), true);
  assert.equal(s.design.functions[TRANSMIT], undefined);
  assert.equal(createStore(graph, { storage }).design.functions[TRANSMIT], undefined);
  assert.equal(s.undo(), true);
  assert.deepEqual(s.design.functions, {});
  assert.equal(s.undo(), false);
});

test('store: new design is undoable and gets a fresh id', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  s.act.choose(MOVE, COREXY);
  const before = s.design;
  s.newDesign();
  assert.deepEqual(s.design.functions, {});
  assert.notEqual(s.design.id, before.id);
  s.undo();
  assert.equal(s.design, before);
});

test('store: undo history is capped', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  for (let i = 0; i < 150; i++) s.act.setIntent(`intent ${i}`);
  let n = 0;
  while (s.undo()) n++;
  assert.equal(n, 100);
});

test('store: listeners hear about changes, text commits are quiet', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  const seen = [];
  const off = s.subscribe((c) => seen.push(c.quiet === true));
  s.act.choose(MOVE, COREXY);
  s.act.setNotes(MOVE, 'x');
  s.undo();
  off();
  s.act.choose(MOVE, COREXY);
  assert.deepEqual(seen, [false, true, false]);
});

test('export and import: file name, round trip, undoable replace', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  s.apply((g, d) => setName(g, d, 'My A3 plotter!'));
  s.act.choose(MOVE, COREXY);
  s.act.reject(TRANSMIT, id('Leadscrew drive'), 'slow');
  s.act.setConstraint(id('Paper format'), 'A4, sometimes A3');
  const exported = serialize(s.design);
  assert.equal(fileName(s.design), 'my-a3-plotter.design.json');
  assert.equal(fileName(emptyDesign()), 'untitled-design.design.json');
  const mine = s.design;
  s.newDesign();
  const r = s.importText(exported);
  assert.equal(r.ok, true);
  assert.deepEqual(s.design, mine);
  s.undo();
  assert.deepEqual(s.design.functions, {});
});

test('import: a bad file is an error and leaves the design alone', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  s.act.choose(MOVE, COREXY);
  const before = s.design;
  for (const text of ['hello', '[]', '{"id":"x"}']) {
    assert.equal(s.importText(text).ok, false, text);
    assert.equal(s.design, before);
  }
  assert.equal(s.notices.length, 3);
  assert.match(s.notices[0].text, /not valid JSON/);
});

test('import: unknown ids are dropped and named in the notice', () => {
  const s = createStore(graph, { storage: fakeStorage() });
  const r = s.importText(JSON.stringify({ functions: { zz99: { choice: COREXY }, [MOVE]: { choice: COREXY } } }));
  assert.equal(r.ok, true);
  assert.ok(s.notices.at(-1).text.includes('zz99'));
  assert.equal(s.design.functions[MOVE].choice, COREXY);
  assert.equal(s.design.functions.zz99, undefined);
});
