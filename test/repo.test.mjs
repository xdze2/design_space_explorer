// Repository checks: project skills are linked where Claude Code finds them, committed designs fit their topic's graph.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { toGraph } from '../scripts/brief.mjs';
import { clean } from '../viewer/design.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const dirs = (path) => (existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);

function skillProblems(name) {
  const file = join(ROOT, 'skills', name, 'SKILL.md');
  if (!existsSync(file)) return [`${name}: no SKILL.md`];
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, 'utf8'));
  const meta = m ? parse(m[1]) ?? {} : {};
  const problems = [];
  if (meta.name !== name) problems.push(`${name}: frontmatter name is ${JSON.stringify(meta.name)}`);
  if (!meta.description) problems.push(`${name}: no description`);
  const link = join(ROOT, '.claude/skills', name);
  let target = null;
  try { target = realpathSync(link); } catch { /* missing or broken */ }
  if (target !== realpathSync(join(ROOT, 'skills', name))) problems.push(`${name}: .claude/skills/${name} does not link to skills/${name}`);
  return problems;
}

test('every project skill has a matching name and a link in .claude/skills', () => {
  const skills = dirs(join(ROOT, 'skills'));
  assert.ok(skills.includes('ingest'));
  assert.deepEqual(skills.flatMap(skillProblems), []);
});

function designProblems(topic) {
  const dir = join(ROOT, 'topics', topic, 'designs');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.design.json')) : [];
  if (!files.length) return [];
  const graph = toGraph(JSON.parse(readFileSync(join(ROOT, 'topics', topic, 'graph.json'), 'utf8')));
  return files.flatMap((f) => {
    const where = `topics/${topic}/designs/${f}`;
    try {
      const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (raw.topic !== topic) return [`${where}: topic is ${JSON.stringify(raw.topic)}, not "${topic}"`];
      return clean(graph, raw).dropped.map((d) => `${where}: ${d}`);
    } catch (e) {
      return [`${where}: ${e.message}`];
    }
  });
}

test('every committed design fits its topic graph with nothing dropped', () => {
  assert.deepEqual(dirs(join(ROOT, 'topics')).flatMap(designProblems), []);
});
