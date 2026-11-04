import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { chipState, entryOf, functionOf, solutionsOf, whatIf, whyPath } from '../design.js';
import { el } from '../dom.js';
import { typeIcon } from '../icons.js';
import { card } from '../card.js';

const joined = (links) => links.flatMap((a, i) => (i ? [', ', a] : [a]));

// Right panel when a node is open: breadcrumb, what the node is, its context and implications, its status in the
// design, a what-if preview, then the edit controls. `route` is { view, fold, peek }. Buttons call the store, never
// the hash: opening nodes never edits, and editing never navigates.
export function render(graph, store, analysis, route) {
  const node = graph.byId.get(route.view);
  const design = store.design;
  const at = (id) => buildHash({ ...route, view: id });
  const link = (id) => el('a', { href: at(id) }, graph.byId.get(id)?.title ?? id);
  const list = (label, ids) => (ids?.length ? el('p', { class: 'edges' }, el('strong', {}, `${label}: `), ...joined(ids.map(link))) : null);
  const fnId = node.type === 'solution' ? functionOf(graph, analysis, node.id) : null;

  const panel = el('div', { class: 'node' });

  const path = whyPath(graph, analysis, node.id);
  panel.append(el('div', { class: 'node-top' },
    path.length
      ? el('nav', { class: 'breadcrumb', 'aria-label': 'Path' }, ...path.flatMap((id, i) => (i ? [' › ', link(id)] : [link(id)])))
      : el('span', { class: 'breadcrumb' }),
    el('a', { class: 'close', href: buildHash({ ...route, view: null }), 'aria-label': 'Close', title: 'Close (Esc)' }, '×')));

  const body = el('div', { class: 'body' });
  body.innerHTML = renderMarkdown(node.body ?? '');
  const selectable = node.type === 'solution' || node.type === 'component';
  panel.append(
    el('h2', {}, typeIcon(node.type), node.title),
    ...(selectable ? [el('div', { class: 'card-head' }, card(graph, node, { at, header: true }))]
      : node.summary ? [el('p', { class: 'node-summary' }, node.summary)] : []),
    el('p', { class: 'meta' }, `${node.type} · confidence: ${node.confidence ?? 'n/a'} · `, el('code', {}, node.id)),
    el('details', { class: 'detail', ...(node.summary ? {} : { open: '' }) },
      el('summary', {}, 'Details'),
      body,
      el('p', { class: 'sources' }, 'Sources: ', (node.sources ?? []).join('; ') || 'none')));

  // Context: where it sits.
  const siblings = node.type === 'solution'
    ? [...new Set((node.why ?? []).flatMap((w) => solutionsOf(graph, w)))].filter((s) => s !== node.id) : [];
  const context = [
    list(node.type === 'constraint' ? 'Constrains' : 'Why', node.type === 'constraint' ? node.constrains : node.why),
    list('Other solutions', siblings),
  ].filter(Boolean);
  if (context.length) panel.append(el('h3', {}, 'Context'), ...context);

  // Implications: what it brings, needs, rules out.
  const bringsLabel = node.type === 'solution' ? 'Brings' : node.type === 'function'
    && solutionsOf(graph, node.id).length ? 'Solutions' : 'Breaks down into';
  const implications = [
    list(bringsLabel, node.how), list('Requires', node.requires), list('Excludes', node.excludes),
    list('Compatible with', node.compatible_with), list('Constrained by', node.constrained_by),
  ].filter(Boolean);
  if (implications.length) panel.append(el('h3', {}, 'Implications'), ...implications);

  panel.append(el('h3', {}, 'In your design'), statusSection(graph, store, analysis, node, fnId, at, link));

  if (node.type === 'solution' && fnId) {
    const preview = whatIfSection(graph, design, analysis, node, fnId, link);
    if (preview) panel.append(el('h3', {}, 'If you chose it'), preview);
  }
  if (node.type === 'function' && !analysis.active.has(node.id)) {
    const makers = (node.why ?? []).filter((w) => graph.byId.get(w)?.type === 'solution');
    if (makers.length) panel.append(el('h3', {}, 'To bring it in'), el('p', {}, 'Choose one of: ', ...joined(makers.map(link))));
  }

  panel.append(editSection(store, analysis, node, fnId));
  return panel;
}

function stateText(graph, chip, link) {
  const by = chip.cause.map(link);
  const withBy = (prefix) => [prefix, ...joined(by)];
  switch (chip.state) {
    case 'chosen': return chip.conflict ? ['Chosen, in conflict: excluded by ', ...joined(by)] : ['Chosen'];
    case 'rejected': return ['Rejected: ', chip.reason];
    case 'excluded': return withBy('Excluded by ');
    case 'required': return withBy('Required by ');
    case 'shortlisted': return ['Shortlisted'];
    default: return ['Open'];
  }
}

function statusSection(graph, store, analysis, node, fnId, at, link) {
  const design = store.design;
  const box = el('div', { class: 'status-box' });

  if (node.type === 'constraint') {
    const value = design.constraints[node.id];
    box.append(value ? el('p', {}, el('strong', {}, 'Value: '), value) : el('p', { class: 'hint' }, 'No value set yet.'));
    const fares = graph.nodes.flatMap((n) => (n.fares ?? []).filter((f) => f.id === node.id).map((f) => ({ id: n.id, score: f.score })));
    for (const [label, keep] of [['Doing well', (f) => f.score > 0], ['Doing badly', (f) => f.score < 0]]) {
      const ids = fares.filter(keep).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)
        || (graph.byId.get(a.id).title < graph.byId.get(b.id).title ? -1 : 1));
      if (ids.length) box.append(el('p', { class: 'edges' }, el('strong', {}, `${label}: `),
        ...joined(ids.map((f) => el('span', {}, link(f.id), ` (${f.score > 0 ? '+' : '−'}${Math.abs(f.score)})`)))));
    }
  } else if (node.type === 'solution') {
    if (!fnId) return box;
    const chip = chipState(analysis, design, fnId, node.id);
    box.append(el('p', { class: `state ${chip.state}` }, el('strong', {}, 'Under '), link(fnId), ': ', ...stateText(graph, chip, link)));
    if (!analysis.active.has(fnId)) box.append(el('p', { class: 'hint' }, 'That function is not part of the design right now.'));
  } else if (node.type === 'function') {
    const e = entryOf(design, node.id);
    const sols = solutionsOf(graph, node.id);
    if (!analysis.active.has(node.id)) box.append(el('p', { class: 'hint' }, 'Not part of the design right now: nothing chosen above brings it in. Its entry is kept.'));
    if (sols.length) {
      box.append(el('p', {}, el('strong', {}, 'Status: '), e.status, ...(e.choice ? [' · choice: ', link(e.choice)] : [])));
      box.append(el('div', { class: 'cards' }, ...sols.map((solId) => {
        const chip = chipState(analysis, design, node.id, solId);
        return card(graph, graph.byId.get(solId), {
          at, chip, state: stateText(graph, chip, link), controls: solutionControls(store, node.id, solId, chip),
        });
      })));
    } else {
      box.append(el('p', { class: 'hint' }, 'This function has no solutions to choose from; it breaks down into the functions below it.'));
    }
  } else {
    const parents = (node.why ?? []).filter((w) => graph.byId.has(w));
    box.append(el('p', {}, el('strong', {}, 'Part of: '), ...joined(parents.map(link)),
      parents.some((p) => analysis.chosenSet.has(p)) ? ' (chosen)' : ' (not chosen)'));
  }
  return box;
}

function whatIfSection(graph, design, analysis, node, fnId, link) {
  const w = whatIf(graph, design, node.id, fnId);
  if (!w) return null;
  const ul = el('ul', { class: 'whatif' });
  const add = (prefix, ids) => { if (ids.length) ul.append(el('li', {}, prefix, ...joined(ids.map(link)))); };
  add('Replaces ', w.replaces ? [w.replaces] : []);
  add('Brings in ', w.activated);
  add('Drops ', w.deactivated);
  add('Adds a requirement on ', w.added);
  add('No longer requires ', w.dropped);
  if (w.conflicts.length) ul.append(el('li', { class: 'bad' }, 'Conflicts with ', ...joined(w.conflicts.map(link))));
  if (!ul.children.length) ul.append(el('li', {}, 'Nothing else would change.'));
  return ul;
}

// Choose / Shortlist / Reject buttons for one solution under one function. Reject asks for a reason in place.
function solutionControls(store, fnId, solId, chip) {
  const btn = (text, fn, extra = '') => {
    const b = el('button', { type: 'button', class: extra }, text);
    b.addEventListener('click', fn);
    return b;
  };
  const box = el('span', { class: 'controls' });
  const chosen = chip.state === 'chosen';
  box.append(chosen ? btn('Unchoose', () => store.act.unchoose(fnId)) : btn('Choose', () => store.act.choose(fnId, solId), 'primary'));
  if (!chosen) {
    box.append(chip.state === 'shortlisted'
      ? btn('Unshortlist', () => store.act.unshortlist(fnId, solId))
      : btn('Shortlist', () => store.act.shortlist(fnId, solId)));
  }
  if (chip.state === 'rejected') {
    box.append(btn('Unreject', () => store.act.unreject(fnId, solId)));
    return box;
  }

  const input = el('input', { type: 'text', placeholder: 'Why not?', 'aria-label': 'Reason for rejecting', maxlength: '300' });
  const error = el('span', { class: 'field-error', role: 'alert' });
  const form = el('form', { class: 'reject-form', hidden: '' }, input,
    el('button', { type: 'submit' }, 'Confirm'), btn('Cancel', close), error);
  const rejectBtn = btn('Reject…', () => {
    rejectBtn.hidden = true;
    form.hidden = false;
    input.focus();
  });
  function close() {
    form.hidden = true;
    rejectBtn.hidden = false;
    input.value = '';
    error.textContent = '';
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) {
      error.textContent = 'A reason is required.';
      input.focus();
      return;
    }
    store.act.reject(fnId, solId, input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });
  box.append(rejectBtn, form);
  return box;
}

function editSection(store, analysis, node, fnId) {
  const section = el('div', { class: 'edit' }, el('h3', {}, 'Edit'));
  const field = (label, tag, value, attrs, commit) => {
    const f = el(tag, { ...attrs, 'aria-label': label });
    f.value = value;
    f.addEventListener('change', () => commit(f.value));
    return el('label', { class: 'field' }, el('span', {}, label), f);
  };
  if (node.type === 'solution' && fnId) {
    const chip = chipState(analysis, store.design, fnId, node.id);
    section.append(el('p', {}, solutionControls(store, fnId, node.id, chip)));
  } else if (node.type === 'function') {
    section.append(field('Notes on this function', 'textarea', entryOf(store.design, node.id).notes, { rows: '3' },
      (v) => store.act.setNotes(node.id, v)));
  } else if (node.type === 'constraint') {
    section.append(field('Value in your design', 'input', store.design.constraints[node.id] ?? '', { type: 'text', placeholder: 'e.g. A4, sometimes A3' },
      (v) => store.act.setConstraint(node.id, v)));
  } else {
    section.append(el('p', { class: 'hint' }, 'A component is a part of a solution: choose the solution to use it.'));
  }
  section.append(el('p', {}, undoButton(store)));
  return section;
}

export function undoButton(store) {
  const b = el('button', { type: 'button', class: 'undo-btn' }, 'Undo');
  b.disabled = !store.canUndo;
  b.addEventListener('click', () => store.undo());
  return b;
}
