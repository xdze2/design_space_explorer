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
const D = '00000a05';
const ROOT = `---\nid: "${R}"\ntitle: Root\ntype: function\nsources: [user]\n---\nRoot body.\n`;

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

function typed(type) {
  return (id, title, extra = []) => node([`id: "${id}"`, `title: ${title}`, `type: ${type}`, 'sources: [user]', ...extra]);
}
const fn = typed('function');
const sol = typed('solution');
const comp = typed('component');
const con = typed('constraint');

const link = (type, from, to, extra = {}) => ({ from, to, type, src: 'user', ...extra });
const how = (from, to, extra = {}) => link('how', from, to, extra);

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
    return { nodes, root: JSON.parse(readFileSync(f.out, 'utf8')).root, byId: Object.fromEntries(nodes.map((n) => [n.id, n])), text: readFileSync(f.out, 'utf8') };
  } finally {
    f.cleanup();
  }
}

test('valid folder compiles: id from frontmatter, not from the path', () => {
  const { byId, nodes, root } = build(
    {
      'root.md': ROOT,
      'gantry.md': node([`id: "${A}"`, 'title: Gantry', 'type: function', 'sources: [user]']),
      'whatever.md': node(
        [`id: "${B}"`, 'title: CoreXY', 'type: solution', 'sources: [user, "LLM:sonnet-5.5"]', 'confidence: low'],
        'Light moving mass.',
      ),
    },
    [how(R, A), how(A, B)],
  );
  assert.equal(root, R);
  assert.deepEqual(nodes.map((n) => n.id), [R, A, B]);
  assert.deepEqual(byId[R].how, [A]);
  assert.deepEqual(byId[A].why, [R]);
  assert.deepEqual(byId[B].why, [A]);
  assert.equal(byId[B].body, 'Light moving mass.');
  assert.equal(byId[B].confidence, 'low');
  for (const n of nodes) for (const f of ['parent', 'parents', 'children', 'slot']) assert.ok(!(f in n));
});

test('missing or malformed id fails and names the file', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node(['title: A', 'type: solution', 'sources: [user]']) }, [], /^a\.md: id must be/);
  for (const id of ['"ABCDEF01"', '"abc"', '"0123456789"', '12345678']) {
    expectFailure({ 'root.md': ROOT, 'a.md': node([`id: ${id}`, 'title: A', 'type: solution', 'sources: [user]']) }, [], /^a\.md: id must be/);
  }
});

test('duplicate id fails and names both files', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(A, 'B') }, [], /^b\.md: duplicate id .* \(also in a\.md\)/);
});

test('missing and empty sources fail and name the node', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: function']) }, [how(R, A)], /^a\.md: sources/);
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: function', 'sources: []']) }, [how(R, A)], /^a\.md: sources/);
});

test('invalid type and confidence fail', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: thing', 'sources: [user]']) }, [how(R, A)], /^a\.md: type/);
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A', ['confidence: huge']) }, [how(R, A)], /^a\.md: confidence/);
});

test('old types root, decision and option fail and name node and type', () => {
  for (const type of ['root', 'decision', 'option']) {
    expectFailure(
      { 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', `type: ${type}`, 'sources: [user]']) },
      [how(R, A)],
      new RegExp(`^a\\.md: type "${type}"`),
    );
  }
});

test('missing title fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'type: solution', 'sources: [user]']) }, [how(R, A)], /^a\.md: missing title/);
});

test('link and slot fields in frontmatter fail and name node and field', () => {
  for (const field of ['slot: Motion', 'parent: x', 'requires: [x]', 'excludes: [x]', 'compatible_with: [x]']) {
    expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A', [field]) }, [how(R, A)], new RegExp(`^a\\.md: ${field.split(':')[0]} is not allowed`));
  }
});

test('node file in a subfolder fails and names the file', () => {
  expectFailure({ 'root.md': ROOT, 'deep/a.md': sol(A, 'A') }, [how(R, A)], /^deep\/a\.md: node files must sit directly/);
});

test('orphan solution fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, [], /^a\.md: cannot reach the root/);
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, undefined, /^a\.md: cannot reach the root/);
});

test('node whose only why is itself unreachable fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': fn(B, 'B') }, [how(A, B)], /^b\.md: cannot reach the root/);
});

test('two roots or no root fails', () => {
  expectFailure({ 'a.md': fn(A, 'A'), 'root.md': ROOT }, [], /exactly one root function.*found 2: a\.md, root\.md/);
  expectFailure({ 'a.md': sol(A, 'A') }, [], /exactly one root function.*found 0/);
});

test('how cycle fails and names a node in it', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': fn(A, 'A'), 'b.md': sol(B, 'B') },
    [how(A, B), how(B, A), how(R, A)],
    new RegExp(`(${A}|${B}): how cycle`),
  );
});

test('two whys: a function under two solutions lists both', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B'), 'c.md': fn(C, 'C') },
    [how(R, A), how(R, B), how(A, C), how(B, C)],
  );
  assert.deepEqual(byId[C].why, [A, B]);
});

test('malformed link lines fail with the line number', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A') };
  expectFailure(files, [how(R, A), '{not json'], /^links\.jsonl:2: not valid JSON/);
  expectFailure(files, [how(R, A), '{"from":"x","to":"y","type":"how"}'], /^links\.jsonl:2: missing or invalid src/);
  expectFailure(files, [{ from: A, to: R, src: 'user' }], /^links\.jsonl:1: missing or invalid type/);
});

test('unknown link type fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, [how(R, A), link('related', A, R)], /^links\.jsonl:2: unknown link type "related"/);
});

test('old parent link fails and names the line', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, [how(R, A), link('parent', A, R)], /^links\.jsonl:2: link type "parent"/);
});

test('how and constrains links are accepted', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'k.md': con(C, 'K') },
    [how(R, A), link('constrains', C, R)],
  );
  assert.deepEqual(byId[C].constrains, [R]);
  assert.deepEqual(byId[R].constrained_by, [C]);
});

test('duplicate link fails and names both lines', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': sol(A, 'A') },
    [how(R, A), { ...how(R, A), src: 'other' }],
    /^links\.jsonl:2: duplicate of line 1/,
  );
});

test('dangling reference fails and names line and id', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A') };
  expectFailure(files, [how(R, A), link('excludes', A, 'deadbeef')], /^links\.jsonl:2: to references unknown node "deadbeef"/);
  expectFailure(files, [how('deadbeef', A)], /^links\.jsonl:1: from references unknown node "deadbeef"/);
});

test('self link fails', () => {
  expectFailure({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, [how(R, A), link('requires', A, A)], /^links\.jsonl:2: link from .* to itself/);
});

test('type pairs: forbidden how pair names line and both types', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'c.md': comp(C, 'C'), 'b.md': fn(B, 'B') },
    [how(R, A), how(A, C), how(C, B)],
    /^links\.jsonl:3: how link from component to function is not allowed/,
  );
  expectFailure({ 'root.md': ROOT, 'c.md': comp(C, 'C') }, [how(R, C)], /^links\.jsonl:1: how link from function to component/);
});

test('type pairs: constraint with a how link at either end', () => {
  const files = { 'root.md': ROOT, 'k.md': con(C, 'K') };
  expectFailure(files, [how(R, C)], /^links\.jsonl:1: how link from function to constraint .*no how links/);
  expectFailure(files, [how(C, R)], /^links\.jsonl:1: how link from constraint to function/);
});

test('type pairs: constrains only from a constraint to a function', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'k.md': con(C, 'K') };
  expectFailure(files, [how(R, A), link('constrains', C, A)], /^links\.jsonl:2: constrains link from constraint to solution/);
  expectFailure(files, [how(R, A), link('constrains', A, R)], /^links\.jsonl:2: constrains link from solution to function/);
});

test('type pairs: requires on a function or constraint fails', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'k.md': con(C, 'K') };
  for (const type of ['requires', 'excludes', 'compatible_with']) {
    expectFailure(files, [how(R, A), link(type, R, A)], new RegExp(`^links\\.jsonl:2: ${type} link from function to solution`));
    expectFailure(files, [how(R, A), link(type, A, C)], new RegExp(`^links\\.jsonl:2: ${type} link from solution to constraint`));
  }
});

test('type pairs: mixed function and solution children fail and name the function', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': fn(B, 'B') },
    [how(R, A), how(R, B)],
    /^root\.md: function has both function and solution how targets/,
  );
});

test('all four how pairs are accepted', () => {
  build(
    { 'root.md': ROOT, 'a.md': fn(A, 'A'), 'b.md': sol(B, 'B'), 'c.md': fn(C, 'C'), 'd.md': comp(D, 'D') },
    [how(R, A), how(A, B), how(B, C), how(B, D)],
  );
});

test('all errors are collected, not just the first', () => {
  const f = fixture(
    { 'root.md': ROOT, 'a.md': node([`id: "${A}"`, 'title: A', 'type: solution']), 'b.md': sol(B, 'B') },
    [how(R, A), link('requires', B, 'deadbeef')],
  );
  try {
    assert.equal(buildGraph(f.graphDir, f.out).errors.length, 2);
  } finally {
    f.cleanup();
  }
});

test('a failed build leaves an existing graph.json untouched', () => {
  const f = fixture({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, []);
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
  assert.deepEqual(nodes[0].how, []);
  assert.deepEqual(nodes[0].why, []);
});

test('requires and compatible_with land on the right nodes', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B') },
    [how(R, A), how(R, B), link('requires', A, B), link('compatible_with', B, A)],
  );
  assert.deepEqual(byId[A].requires, [B]);
  assert.deepEqual(byId[B].requires, []);
  assert.deepEqual(byId[B].compatible_with, [A]);
});

test('excludes is symmetric in the output', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B') },
    [how(R, A), how(R, B), link('excludes', A, B)],
  );
  assert.deepEqual(byId[A].excludes, [B]);
  assert.deepEqual(byId[B].excludes, [A]);
});

test('constraint lists are always present', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'k.md': con(C, 'K') },
    [how(R, A), link('constrains', C, R)],
  );
  assert.deepEqual(byId[A].constrains, []);
  assert.deepEqual(byId[A].constrained_by, []);
  assert.deepEqual(byId[C].constrained_by, []);
});

test('without order, how is sorted by title; why follows the links-file order; nodes are sorted by id', () => {
  const { byId, nodes } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'Zeta'), 'b.md': sol(B, 'Alpha'), 'c.md': sol(C, 'Mid') },
    [how(R, C), how(R, A), how(R, B)],
  );
  assert.deepEqual(byId[R].how, [B, C, A]);
  assert.deepEqual(nodes.map((n) => n.id), [R, A, B, C]);
});

test('why keeps the links-file order', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B'), 'f.md': fn(C, 'F') },
    [how(R, A), how(R, B), how(B, C), how(A, C)],
  );
  assert.deepEqual(byId[C].why, [B, A]);
});

test('how is sorted by order, links without order come after, by title', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'Alpha'), 'b.md': sol(B, 'Beta'), 'c.md': sol(C, 'Gamma'), 'd.md': sol(D, 'Delta') },
    [how(R, A), how(R, B, { order: 2 }), how(R, C, { order: 1 }), how(R, D)],
  );
  assert.deepEqual(byId[R].how, [C, B, A, D]);
});

test('order is per parent', () => {
  const { byId } = build(
    { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B'), 'f.md': fn(C, 'F'), 'g.md': fn(D, 'G') },
    [how(R, C, { order: 2 }), how(R, D, { order: 1 }), how(C, A, { order: 1 }), how(C, B, { order: 2 }), how(D, B, { order: 1 }), how(D, A, { order: 2 })],
  );
  assert.deepEqual(byId[R].how, [D, C]);
  assert.deepEqual(byId[C].how, [A, B]);
  assert.deepEqual(byId[D].how, [B, A]);
});

test('order must be an integer, and only on how links', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B') };
  expectFailure(files, [how(R, A), how(R, B, { order: '2' })], /^links\.jsonl:2: order must be an integer/);
  expectFailure(files, [how(R, A, { order: 1.5 })], /^links\.jsonl:1: order must be an integer/);
  expectFailure(files, [how(R, A), how(R, B), link('requires', A, B, { order: 1 })], /^links\.jsonl:3: order is only allowed on how links/);
});

test('output does not depend on the order of the links file', () => {
  const files = { 'root.md': ROOT, 'a.md': sol(A, 'A'), 'b.md': sol(B, 'B') };
  const links = [how(R, A), how(R, B), link('excludes', A, B), link('requires', B, A)];
  const first = build(files, links).text;
  assert.equal(build(files, [links[0], links[1], links[3], links[2]]).text, first);
});

test('a stale hint does not matter and is not copied to the output', () => {
  const { text } = build({ 'root.md': ROOT, 'a.md': sol(A, 'A') }, [how(R, A, { hint: 'Totally > Wrong' })]);
  assert.ok(!text.includes('Wrong'));
});
