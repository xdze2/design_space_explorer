import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildGraph } from '../scripts/build-graph.mjs';

const R = '00000a01';
const A = '00000a02';
const B = '00000a03';
const C = '00000a04';
const ROOT = `---\nid: "${R}"\ntitle: Root\ntype: root\nsources: [user]\n---\nRoot body.\n`;

function fixture(files, links) {
  const dir = mkdtempSync(join(tmpdir(), 'graph-'));
  const graphDir = join(dir, 'graph');
  mkdirSync(graphDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const path = join(graphDir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  if (links !== undefined) {
    writeFileSync(join(graphDir, 'links.jsonl'), links.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n');
  }
  return { graphDir, out: join(dir, 'graph.json'), cleanup: () => rmSync(dir, { recursive: true }) };
}

function node(fields, body = 'Body.') {
  return `---\n${fields.join('\n')}\n---\n${body}\n`;
}

function option(id, title, extra = []) {
  return node([`id: "${id}"`, `title: ${title}`, 'type: option', 'sources: [user]', ...extra]);
}

const link = (type, from, to, extra = {}) => ({ from, to, type, src: 'user', ...extra });
const parent = (from, to) => link('parent', from, to);

function expectFailure(files, links, pattern) {
  const f = fixture(files, links);
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got ${JSON.stringify(errors)}`);
    assert.equal(existsSync(f.out), false, 'graph.json must not be written on failure');
  } finally {
    f.cleanup();
  }
}

function build(files, links) {
  const f = fixture(files, links);
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.deepEqual(errors, []);
    const nodes = JSON.parse(readFileSync(f.out, 'utf8')).nodes;
    return { nodes, byId: Object.fromEntries(nodes.map((n) => [n.id, n])), text: readFileSync(f.out, 'utf8') };
  } finally {
    f.cleanup();
  }
}

test('valid folder compiles: id from frontmatter, not from the path', () => {
  const { byId, nodes } = build(
    {
      'root.md': ROOT,
      'deep/er/gantry.md': node([`id: "${A}"`, 'title: Gantry', 'type: decision', 'sources: [user]']),
      'whatever.md': node(
        [`id: "${B}"`, 'title: CoreXY', 'type: option', 'sources: [user, "LLM:sonnet-5.5"]', 'confidence: low'],
        'Light moving mass.',
      ),
    },
    [parent(A, R), parent(B, A)],
  );
  assert.deepEqual(nodes.map((n) => n.id), [R, A, B]);
  assert.deepEqual(byId[R].children, [A]);
  assert.deepEqual(byId[A].children, [B]);
  assert.equal(byId[B].parent, A);
  assert.deepEqual(byId[B].parents, [A]);
  assert.equal(byId[B].body, 'Light moving mass.');
  assert.equal(byId[B].confidence, 'low');
  assert.ok(!('parent' in byId[R]));
});

test('missing or malformed id fails and names the file', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node(['title: A', 'type: option', 'sources: [user]']) }, [], /^a\.md: id must be/);
  for (const id of ['"ABCDEF01"', '"abc"', '"0123456789"', '12345678']) {
    expectFailure({ 'root.md': ROOT, 'a.md': node([`id: ${id}`, 'title: A', 'type: option', 'sources: [user]']) }, [], /^a\.md: id must be/);
  }
});

test('duplicate id fails and names both files', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(A, 'B') }, [], /^b\.md: duplicate id .* \(also in a\.md\)/);
});

test('missing and empty sources fail and name the node', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: decision']) }, [parent(A, R)], /^a\.md: sources/);
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: decision', 'sources: []']) }, [parent(A, R)], /^a\.md: sources/);
});

test('invalid type and confidence fail', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: thing', 'sources: [user]']) }, [parent(A, R)], /^a\.md: type/);
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A', ['confidence: huge']) }, [parent(A, R)], /^a\.md: confidence/);
});

test('missing title fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'type: option', 'sources: [user]']) }, [parent(A, R)], /^a\.md: missing title/);
});

test('link fields in frontmatter fail and name node and field', () => {
  for (const field of ['parent: x', 'requires: [x]', 'excludes: [x]', 'compatible_with: [x]']) {
    expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A', [field]) }, [parent(A, R)], new RegExp(`^a\\.md: ${field.split(':')[0]} is a link`));
  }
});

test('orphan node fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A') }, [], /^a\.md: non-root node has no parent/);
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A') }, undefined, /^a\.md: non-root node has no parent/);
});

test('no root or two roots fails', () => {
  const root2 = node([`id: "${A}"`, 'title: A', 'type: root', 'sources: [user]']);
  expectFailure({ 'a.md': root2, 'root.md': ROOT }, [], /exactly one root/);
  expectFailure({ 'a.md': option(A, 'A') }, [], /exactly one root/);
});

test('parent cycle fails and names a node in it', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(B, 'B') },
    [parent(A, B), parent(B, A), parent(A, R)],
    new RegExp(`(${A}|${B}): parent cycle`),
  );
});

test('malformed link lines fail with the line number', () => {
  const files = { 'root.md': ROOT, 'a.md': option(A, 'A') };
  expectFailure(files, [parent(A, R), '{not json'], /^links\.jsonl:2: not valid JSON/);
  expectFailure(files, [parent(A, R), '{"from":"x","to":"y","type":"parent"}'], /^links\.jsonl:2: missing or invalid src/);
  expectFailure(files, [{ from: A, to: R, src: 'user' }], /^links\.jsonl:1: missing or invalid type/);
});

test('unknown link type fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A') }, [parent(A, R), link('related', A, R)], /^links\.jsonl:2: unknown link type "related"/);
});

test('duplicate link fails and names both lines', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': option(A, 'A') },
    [parent(A, R), parent(A, R, { src: 'other' })],
    /^links\.jsonl:2: duplicate of line 1/,
  );
});

test('dangling reference fails and names line and id', () => {
  const files = { 'root.md': ROOT, 'a.md': option(A, 'A') };
  expectFailure(files, [parent(A, R), link('excludes', A, 'deadbeef')], /^links\.jsonl:2: to references unknown node "deadbeef"/);
  expectFailure(files, [parent('deadbeef', R)], /^links\.jsonl:1: from references unknown node "deadbeef"/);
});

test('self link fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': option(A, 'A') }, [parent(A, R), link('requires', A, A)], /^links\.jsonl:2: link from .* to itself/);
});

test('all errors are collected, not just the first', () => {
  const f = fixture(
    { 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: option']), 'b.md': option(B, 'B') },
    [parent(A, R), link('requires', B, 'deadbeef')],
  );
  try {
    assert.equal(buildGraph(f.graphDir, f.out).errors.length, 2);
  } finally {
    f.cleanup();
  }
});

test('a failed build leaves an existing graph.json untouched', () => {
  const f = fixture({ 'root.md': ROOT, 'a.md': option(A, 'A') }, []);
  try {
    writeFileSync(f.out, 'previous');
    buildGraph(f.graphDir, f.out);
    assert.equal(readFileSync(f.out, 'utf8'), 'previous');
  } finally {
    f.cleanup();
  }
});

test('missing links file means no links', () => {
  const { nodes } = build({ 'root.md': ROOT }, undefined);
  assert.deepEqual(nodes[0].children, []);
});

test('requires and compatible_with land on the right nodes', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(B, 'B') },
    [parent(A, R), parent(B, R), link('requires', A, B), link('compatible_with', B, A)],
  );
  assert.deepEqual(byId[A].requires, [B]);
  assert.deepEqual(byId[B].requires, []);
  assert.deepEqual(byId[B].compatible_with, [A]);
});

test('excludes is symmetric in the output', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(B, 'B') },
    [parent(A, R), parent(B, R), link('excludes', A, B)],
  );
  assert.deepEqual(byId[A].excludes, [B]);
  assert.deepEqual(byId[B].excludes, [A]);
});

test('slot is passed through and optional', () => {
  const { byId } = build(
    {
      'root.md': ROOT,
      'a.md': node([`id: "${A}"`, 'title: A', 'type: decision', 'sources: [user]', 'slot: Motion']),
      'b.md': node([`id: "${B}"`, 'title: B', 'type: decision', 'sources: [user]']),
    },
    [parent(A, R), parent(B, R)],
  );
  assert.equal(byId[A].slot, 'Motion');
  assert.ok(!('slot' in byId[B]));
});

test('invalid slot fails and names the node', () => {
  for (const slot of ['[a, b]', '""']) {
    expectFailure(
      { 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: decision', 'sources: [user]', `slot: ${slot}`]) },
      [parent(A, R)],
      /^a\.md: slot/,
    );
  }
});

test('two parents: node is a child of both, parent is the first', () => {
  const files = { 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(B, 'B'), 'c.md': option(C, 'C') };
  const { byId } = build(files, [parent(A, R), parent(B, R), parent(C, B), parent(C, A)]);
  assert.deepEqual(byId[C].parents, [B, A]);
  assert.equal(byId[C].parent, B);
  assert.deepEqual(byId[A].children, [C]);
  assert.deepEqual(byId[B].children, [C]);
});

test('children are sorted by title, nodes by id', () => {
  const { byId, nodes } = build(
    { 'root.md': ROOT, 'a.md': option(A, 'Zeta'), 'b.md': option(B, 'Alpha'), 'c.md': option(C, 'Mid') },
    [parent(C, R), parent(A, R), parent(B, R)],
  );
  assert.deepEqual(byId[R].children, [B, C, A]);
  assert.deepEqual(nodes.map((n) => n.id), [R, A, B, C]);
});

test('output does not depend on the order of the links file', () => {
  const files = { 'root.md': ROOT, 'a.md': option(A, 'A'), 'b.md': option(B, 'B') };
  const links = [parent(A, R), parent(B, R), link('excludes', A, B), link('requires', B, A)];
  const first = build(files, links).text;
  assert.equal(build(files, [...links].reverse()).text, first);
  assert.equal(build(files, links).text, first);
});

test('a stale hint does not matter and is not copied to the output', () => {
  const { text } = build({ 'root.md': ROOT, 'a.md': option(A, 'A') }, [parent(A, R, { hint: 'Totally > Wrong' })]);
  assert.ok(!text.includes('Wrong'));
});
