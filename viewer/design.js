// The user's design: one JSON document, changed only by the pure actions below. No DOM here.
// { format, id, name, intent, constraints: { <constraint id>: text }, functions: { <function id>: entry } }
// entry = { status: 'open'|'exploring'|'decided', choice: <solution id>|null, shortlist: [ids], rejected: [{ id, reason }], notes }
export const FORMAT = 1;
export const DEFAULT_NAME = 'Untitled design';
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const freshId = () => `d-${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`;
const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export const emptyDesign = () => ({ format: FORMAT, id: freshId(), name: DEFAULT_NAME, intent: '', constraints: {}, functions: {} });
export const emptyEntry = () => ({ status: 'open', choice: null, shortlist: [], rejected: [], notes: '' });
export const entryOf = (design, fnId) => design.functions[fnId] ?? emptyEntry();

const titleOf = (graph, id) => graph.byId.get(id)?.title ?? id;
const label = (graph, id) => (graph.byId.has(id) ? `${titleOf(graph, id)} (${id})` : id);

// The solutions a function offers, in the author's order.
export const solutionsOf = (graph, fnId) =>
  (graph.byId.get(fnId)?.how ?? []).filter((h) => graph.byId.get(h)?.type === 'solution');

// A decision is a function whose how targets are solutions: the user chooses one of them.
export const decisions = (graph) => graph.nodes.filter((n) => n.type === 'function' && solutionsOf(graph, n.id).length);

const statusOf = (e) => (e.choice ? 'decided' : e.shortlist.length ? 'exploring' : 'open');
const isBlank = (e) => !e.choice && !e.shortlist.length && !e.rejected.length && !e.notes;

// True when nothing was recorded yet (the name alone does not count).
export const isEmpty = (d) =>
  !d.intent && !Object.keys(d.constraints).length && !Object.keys(d.functions).length;

function withEntry(design, fnId, entry) {
  const e = { ...entry, status: statusOf(entry) };
  const functions = { ...design.functions };
  if (isBlank(e)) delete functions[fnId];
  else functions[fnId] = e;
  return { ...design, functions };
}

// Loads a document from untrusted JSON: throws if it is not a design at all, otherwise drops what does not fit the
// graph and says what in `dropped`. The result always satisfies the rules the actions keep.
export function clean(graph, raw) {
  if (!isObject(raw)) throw new Error('Not a design: expected a JSON object');
  if (!isObject(raw.functions)) throw new Error('Not a design: no "functions" object');
  const dropped = [];
  const design = emptyDesign();
  if (typeof raw.id === 'string' && ID_RE.test(raw.id)) design.id = raw.id;
  else if (raw.id !== undefined) dropped.push(`invalid design id ${JSON.stringify(raw.id)}`);
  if (typeof raw.name === 'string' && raw.name.trim()) design.name = raw.name.trim();
  if (typeof raw.intent === 'string') design.intent = raw.intent.trim();

  for (const [id, value] of Object.entries(isObject(raw.constraints) ? raw.constraints : {})) {
    const node = graph.byId.get(id);
    if (!node) dropped.push(`unknown node id ${id}`);
    else if (node.type !== 'constraint') dropped.push(`${label(graph, id)} is not a constraint`);
    else if (typeof value !== 'string') dropped.push(`invalid value for ${label(graph, id)}`);
    else if (value.trim()) design.constraints[id] = value.trim();
  }

  for (const [fnId, r] of Object.entries(raw.functions)) {
    const node = graph.byId.get(fnId);
    if (!node) { dropped.push(`unknown node id ${fnId}`); continue; }
    if (node.type !== 'function') { dropped.push(`${label(graph, fnId)} is not a function`); continue; }
    if (!isObject(r)) { dropped.push(`invalid entry for ${label(graph, fnId)}`); continue; }
    const sols = solutionsOf(graph, fnId);
    const where = label(graph, fnId);
    const entry = emptyEntry();
    if (r.choice != null) {
      if (typeof r.choice === 'string' && sols.includes(r.choice)) entry.choice = r.choice;
      else dropped.push(`${where}: ${label(graph, String(r.choice))} is not a solution of this function, choice dropped`);
    }
    for (const s of Array.isArray(r.shortlist) ? r.shortlist : []) {
      if (typeof s !== 'string' || !sols.includes(s)) dropped.push(`${where}: ${label(graph, String(s))} is not a solution of this function, dropped from the shortlist`);
      else if (s !== entry.choice && !entry.shortlist.includes(s)) entry.shortlist.push(s);
    }
    for (const rej of Array.isArray(r.rejected) ? r.rejected : []) {
      const id = rej?.id;
      const reason = typeof rej?.reason === 'string' ? rej.reason.trim() : '';
      if (typeof id !== 'string' || !sols.includes(id)) dropped.push(`${where}: ${label(graph, String(id))} is not a solution of this function, rejection dropped`);
      else if (!reason) dropped.push(`${where}: rejection of ${label(graph, id)} has no reason, dropped`);
      else if (id === entry.choice) dropped.push(`${where}: ${label(graph, id)} is chosen and rejected, rejection dropped`);
      else if (entry.shortlist.includes(id)) dropped.push(`${where}: ${label(graph, id)} is shortlisted and rejected, rejection dropped`);
      else if (!entry.rejected.some((x) => x.id === id)) entry.rejected.push({ id, reason });
    }
    if (typeof r.notes === 'string') entry.notes = r.notes.trim();
    Object.assign(design, withEntry(design, fnId, entry));
  }
  return { design, dropped };
}

// ---- actions: (graph, design, ...args) -> design. An action that changes nothing returns the same object. ----

const offers = (graph, fnId, solId) => solutionsOf(graph, fnId).includes(solId);

export function choose(graph, d, fnId, solId) {
  if (!offers(graph, fnId, solId)) return d;
  const e = entryOf(d, fnId);
  if (e.choice === solId) return d;
  const shortlist = e.shortlist.filter((s) => s !== solId);
  if (e.choice) shortlist.push(e.choice);
  return withEntry(d, fnId, { ...e, choice: solId, shortlist, rejected: e.rejected.filter((r) => r.id !== solId) });
}

export function unchoose(graph, d, fnId) {
  const e = entryOf(d, fnId);
  return e.choice ? withEntry(d, fnId, { ...e, choice: null }) : d;
}

export function shortlist(graph, d, fnId, solId) {
  const e = entryOf(d, fnId);
  if (!offers(graph, fnId, solId) || e.choice === solId || e.shortlist.includes(solId)) return d;
  return withEntry(d, fnId, { ...e, shortlist: [...e.shortlist, solId], rejected: e.rejected.filter((r) => r.id !== solId) });
}

export function unshortlist(graph, d, fnId, solId) {
  const e = entryOf(d, fnId);
  return e.shortlist.includes(solId) ? withEntry(d, fnId, { ...e, shortlist: e.shortlist.filter((s) => s !== solId) }) : d;
}

// Rejecting needs a reason; a rejected solution is neither chosen nor shortlisted any more.
export function reject(graph, d, fnId, solId, reason) {
  const why = String(reason ?? '').trim();
  if (!why || !offers(graph, fnId, solId)) return d;
  const e = entryOf(d, fnId);
  return withEntry(d, fnId, {
    ...e,
    choice: e.choice === solId ? null : e.choice,
    shortlist: e.shortlist.filter((s) => s !== solId),
    rejected: [...e.rejected.filter((r) => r.id !== solId), { id: solId, reason: why }],
  });
}

export function unreject(graph, d, fnId, solId) {
  const e = entryOf(d, fnId);
  return e.rejected.some((r) => r.id === solId) ? withEntry(d, fnId, { ...e, rejected: e.rejected.filter((r) => r.id !== solId) }) : d;
}

export function setNotes(graph, d, fnId, text) {
  if (graph.byId.get(fnId)?.type !== 'function') return d;
  const e = entryOf(d, fnId);
  const notes = String(text ?? '').trim();
  return notes === e.notes ? d : withEntry(d, fnId, { ...e, notes });
}

export function setConstraint(graph, d, id, text) {
  if (graph.byId.get(id)?.type !== 'constraint') return d;
  const value = String(text ?? '').trim();
  if (value === (d.constraints[id] ?? '')) return d;
  const constraints = { ...d.constraints };
  if (value) constraints[id] = value;
  else delete constraints[id];
  return { ...d, constraints };
}

export function setName(graph, d, text) {
  const name = String(text ?? '').trim() || DEFAULT_NAME;
  return name === d.name ? d : { ...d, name };
}

export function setIntent(graph, d, text) {
  const intent = String(text ?? '').trim();
  return intent === d.intent ? d : { ...d, intent };
}

export const ACTIONS = { choose, unchoose, shortlist, unshortlist, reject, unreject, setNotes, setConstraint, setName, setIntent };

// ---- analysis ----

// What the design amounts to. A function is active when it is the root, a how target of an active function, or a how
// target of the choice of an active function; entries of inactive functions are kept but do not count.
// Direct requires / excludes only.
export function analyzeDesign(graph, design) {
  const active = new Set();
  const chosen = new Map(); // active function id -> chosen solution id
  const visit = (fnId) => {
    if (active.has(fnId) || graph.byId.get(fnId)?.type !== 'function') return;
    active.add(fnId);
    const node = graph.byId.get(fnId);
    for (const h of node.how ?? []) visit(h);
    const choice = entryOf(design, fnId).choice;
    if (choice && offers(graph, fnId, choice)) {
      chosen.set(fnId, choice);
      for (const h of graph.byId.get(choice).how ?? []) visit(h);
    }
  };
  visit(graph.rootId);

  const chosenSet = new Set(chosen.values());
  const excluded = new Map(); // solution id -> first chosen solution that excludes it
  const required = new Map(); // solution id (not chosen) -> chosen solutions that require it
  const conflicts = []; // [a, b] pairs of chosen solutions linked by excludes
  for (const sol of chosenSet) {
    const node = graph.byId.get(sol);
    for (const ex of node.excludes ?? []) {
      if (!excluded.has(ex)) excluded.set(ex, sol);
      if (chosenSet.has(ex) && sol < ex) conflicts.push([sol, ex]);
    }
    for (const req of node.requires ?? []) {
      if (chosenSet.has(req) || graph.byId.get(req)?.type !== 'solution') continue;
      required.set(req, [...(required.get(req) ?? []), sol]);
    }
  }
  const undecided = [...active].filter((id) => solutionsOf(graph, id).length && !chosen.has(id));
  return { active, chosen, chosenSet, excluded, required, missing: required, conflicts, undecided, problems: conflicts.length + required.size };
}

// How a solution chip is drawn, by priority: chosen, rejected, excluded, required, shortlisted, open.
// `cause` lists the chosen solutions behind an excluded / required state; `conflict` marks a counted choice that is excluded.
export function chipState(analysis, design, fnId, solId) {
  const e = entryOf(design, fnId);
  const excludedBy = analysis.excluded.get(solId);
  const requiredBy = analysis.required.get(solId);
  const conflict = analysis.chosen.get(fnId) === solId && excludedBy !== undefined;
  if (e.choice === solId) return { state: 'chosen', cause: excludedBy ? [excludedBy] : [], conflict };
  const rejected = e.rejected.find((r) => r.id === solId);
  if (rejected) return { state: 'rejected', cause: [], reason: rejected.reason, conflict: false };
  if (excludedBy) return { state: 'excluded', cause: [excludedBy], conflict: false };
  if (requiredBy) return { state: 'required', cause: requiredBy, conflict: false };
  if (e.shortlist.includes(solId)) return { state: 'shortlisted', cause: [], conflict: false };
  return { state: 'open', cause: [], conflict: false };
}

// The function a solution is chosen under: an active one if it has several whys.
export function functionOf(graph, analysis, solId) {
  const fns = (graph.byId.get(solId)?.why ?? []).filter((w) => graph.byId.get(w)?.type === 'function');
  return fns.find((f) => analysis.active.has(f)) ?? fns[0] ?? null;
}

// What choosing `solId` (under `fnId`, default the function it belongs to) would change. The design is not touched.
export function whatIf(graph, design, solId, fnId) {
  const before = analyzeDesign(graph, design);
  const fn = fnId ?? functionOf(graph, before, solId);
  if (!fn || !offers(graph, fn, solId) || entryOf(design, fn).choice === solId) return null;
  const after = analyzeDesign(graph, choose(graph, design, fn, solId));
  const gone = (a, b) => [...a].filter((x) => !b.has(x));
  const partner = ([a, b]) => (a === solId ? b : b === solId ? a : null);
  return {
    fn,
    replaces: entryOf(design, fn).choice,
    activated: gone(after.active, before.active),
    deactivated: gone(before.active, after.active),
    added: gone(after.required.keys(), before.required),
    dropped: gone(before.required.keys(), after.required),
    conflicts: after.conflicts.map(partner).filter(Boolean),
  };
}

// Breadcrumb: ids from the root down to the parent of `id`. At each step the parent that is active / chosen wins,
// else the first why. A constraint continues from the function it constrains.
export function whyPath(graph, analysis, id) {
  const path = [];
  const seen = new Set([id]);
  let cur = id;
  while (cur !== graph.rootId) {
    const node = graph.byId.get(cur);
    const parents = (node?.why?.length ? node.why : node?.constrains ?? []).filter((p) => graph.byId.has(p) && !seen.has(p));
    if (!parents.length) break;
    const p = parents.find((x) => analysis.active.has(x) || analysis.chosenSet.has(x)) ?? parents[0];
    path.unshift(p);
    seen.add(p);
    cur = p;
  }
  return path;
}
