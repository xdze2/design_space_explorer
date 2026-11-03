import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildGraph } from '../scripts/build-graph.mjs';

const ROOT = '---\ntitle: Root\ntype: root\nsources: [user]\n---\nRoot body.\n';

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'graph-'));
  const graphDir = join(dir, 'graph');
  for (const [name, content] of Object.entries(files)) {
    const path = join(graphDir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return { graphDir, out: join(dir, 'graph.json'), cleanup: () => rmSync(dir, { recursive: true }) };
}

function node(fields, body = 'Body.') {
  return `---\n${fields.join('\n')}\n---\n${body}\n`;
}

function expectFailure(files, pattern) {
  const f = fixture(files);
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got ${JSON.stringify(errors)}`);
    assert.equal(existsSync(f.out), false, 'graph.json must not be written on failure');
  } finally {
    f.cleanup();
  }
}

test('valid folder compiles with ids and children', () => {
  const f = fixture({
    'root.md': ROOT,
    'gantry/gantry.md': node(['title: Gantry', 'type: decision', 'parent: root', 'sources: [user]']),
    'gantry/corexy.md': node(
      ['title: CoreXY', 'type: option', 'parent: gantry/gantry', 'sources: [user, "LLM:sonnet-5.5"]', 'confidence: low'],
      'Light moving mass.',
    ),
  });
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.deepEqual(errors, []);
    const { nodes } = JSON.parse(readFileSync(f.out, 'utf8'));
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    assert.deepEqual(Object.keys(byId).sort(), ['gantry/corexy', 'gantry/gantry', 'root']);
    assert.deepEqual(byId.root.children, ['gantry/gantry']);
    assert.deepEqual(byId['gantry/gantry'].children, ['gantry/corexy']);
    assert.equal(byId['gantry/corexy'].body, 'Light moving mass.');
    assert.equal(byId['gantry/corexy'].confidence, 'low');
  } finally {
    f.cleanup();
  }
});

test('missing sources fails and names the node', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: decision', 'parent: root']) },
    /^a: sources/,
  );
});

test('empty sources fails', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: decision', 'parent: root', 'sources: []']) },
    /^a: sources/,
  );
});

test('invalid type and confidence fail', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: thing', 'parent: root', 'sources: [user]']) },
    /^a: type/,
  );
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: option', 'parent: root', 'sources: [user]', 'confidence: huge']) },
    /^a: confidence/,
  );
});

test('missing title fails', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['type: option', 'parent: root', 'sources: [user]']) },
    /^a: missing title/,
  );
});

test('orphan node fails', () => {
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: option', 'sources: [user]']) },
    /^a: non-root node has no parent/,
  );
});

test('no root or two roots fails', () => {
  expectFailure({ 'a.md': node(['title: A', 'type: root', 'sources: [user]']), 'b.md': ROOT }, /exactly one root/);
  expectFailure({ 'a.md': node(['title: A', 'type: decision', 'parent: a', 'sources: [user]']) }, /exactly one root/);
});

test('parent cycle fails', () => {
  expectFailure(
    {
      'root.md': ROOT,
      'a.md': node(['title: A', 'type: option', 'parent: b', 'sources: [user]']),
      'b.md': node(['title: B', 'type: option', 'parent: a', 'sources: [user]']),
    },
    /parent cycle/,
  );
});

test('dangling reference fails and names node and id', () => {
  expectFailure(
    {
      'root.md': ROOT,
      'a.md': node(['title: A', 'type: option', 'parent: root', 'sources: [user]', 'excludes: [gantry/doesnotexist]']),
    },
    /^a: excludes references unknown node "gantry\/doesnotexist"/,
  );
  expectFailure(
    { 'root.md': ROOT, 'a.md': node(['title: A', 'type: option', 'parent: nope', 'sources: [user]']) },
    /^a: parent references unknown node "nope"/,
  );
});

test('all errors are collected, not just the first', () => {
  const f = fixture({
    'root.md': ROOT,
    'a.md': node(['title: A', 'type: option', 'parent: root']),
    'b.md': node(['title: B', 'type: option', 'sources: [user]']),
  });
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.equal(errors.length, 2);
  } finally {
    f.cleanup();
  }
});

test('a failed build leaves an existing graph.json untouched', () => {
  const f = fixture({ 'root.md': ROOT, 'a.md': node(['title: A', 'type: option', 'parent: root']) });
  try {
    writeFileSync(f.out, 'previous');
    buildGraph(f.graphDir, f.out);
    assert.equal(readFileSync(f.out, 'utf8'), 'previous');
  } finally {
    f.cleanup();
  }
});

test('excludes is symmetric in the output', () => {
  const f = fixture({
    'root.md': ROOT,
    'a.md': node(['title: A', 'type: option', 'parent: root', 'sources: [user]', 'excludes: [b]']),
    'b.md': node(['title: B', 'type: option', 'parent: root', 'sources: [user]']),
  });
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.deepEqual(errors, []);
    const byId = Object.fromEntries(JSON.parse(readFileSync(f.out, 'utf8')).nodes.map((n) => [n.id, n]));
    assert.deepEqual(byId.a.excludes, ['b']);
    assert.deepEqual(byId.b.excludes, ['a']);
  } finally {
    f.cleanup();
  }
});

test('slot is passed through and optional', () => {
  const f = fixture({
    'root.md': ROOT,
    'a.md': node(['title: A', 'type: decision', 'parent: root', 'sources: [user]', 'slot: Motion']),
    'b.md': node(['title: B', 'type: decision', 'parent: root', 'sources: [user]']),
  });
  try {
    const { errors } = buildGraph(f.graphDir, f.out);
    assert.deepEqual(errors, []);
    const byId = Object.fromEntries(JSON.parse(readFileSync(f.out, 'utf8')).nodes.map((n) => [n.id, n]));
    assert.equal(byId.a.slot, 'Motion');
    assert.ok(!('slot' in byId.b));
  } finally {
    f.cleanup();
  }
});

test('invalid slot fails and names the node', () => {
  for (const slot of ['[a, b]', '""']) {
    expectFailure(
      { 'root.md': ROOT, 'a.md': node(['title: A', 'type: decision', 'parent: root', 'sources: [user]', `slot: ${slot}`]) },
      /^a: slot/,
    );
  }
});
