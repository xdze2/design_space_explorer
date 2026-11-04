import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';
import { designKey, contentHash, buildPrompt, parseBrief } from '../brief.js';
import { isEmpty, entryOf } from '../design.js';
import { fileName, serialize } from '../store.js';
import { undoButton } from './node.js';

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

// Cached brief for the design, or null (a missing index means no briefs).
async function loadBrief(graph, design) {
  const index = await fetchText('../briefs/index.json').then(JSON.parse, () => ({}));
  const entry = index[designKey(design)];
  if (!entry) return null;
  const { meta, body } = parseBrief(await fetchText(`../briefs/${entry.file}`));
  return { meta, body, stale: meta.content_hash !== contentHash(graph, design) };
}

async function copyText(text, area) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    area.select();
    return false;
  }
}

function promptBox(prompt) {
  const area = el('textarea', { class: 'prompt-text', readonly: '', rows: '12' });
  area.value = prompt;
  const status = el('span', { class: 'copy-status' });
  const button = el('button', { type: 'button' }, 'Copy prompt');
  button.addEventListener('click', async () => {
    status.textContent = (await copyText(prompt, area)) ? 'Copied' : 'Clipboard unavailable: text selected, press Ctrl+C';
  });
  return el('details', { class: 'prompt-box' },
    el('summary', {}, 'Prompt for an AI brief'), button, ' ', status, area);
}

async function fillBrief(slot, graph, design) {
  const [brief, template] = await Promise.all([
    loadBrief(graph, design).catch(() => null),
    fetchText('../prompts/brief.md').catch(() => null),
  ]);
  if (brief) {
    const body = el('div', { class: 'body' });
    body.innerHTML = renderMarkdown(brief.body);
    slot.append(el('section', { class: 'brief' },
      el('h3', {}, 'Brief'),
      el('p', { class: 'brief-meta' }, `Written by ${brief.meta.model ?? 'unknown'}`,
        brief.stale ? el('span', { class: 'stale' }, ' · stale: the design changed since this brief was written') : ''),
      body));
  } else {
    slot.append(el('p', { class: 'brief-none' }, 'No brief exists for this design yet.'));
  }
  if ((!brief || brief.stale) && template) slot.append(promptBox(buildPrompt(template, graph, design)));
}

function download(design) {
  const url = URL.createObjectURL(new Blob([serialize(design)], { type: 'application/json' }));
  const a = el('a', { href: url, download: fileName(design) });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Right panel when no node is open: the design as a whole.
export function render(graph, store, analysis, route) {
  const design = store.design;
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const open = (id) => el('a', { href: buildHash({ ...route, view: id }) }, title(id));
  const { problems, undecided } = analysis;

  const field = (label, tag, value, attrs, commit) => {
    const f = el(tag, { ...attrs, 'aria-label': label });
    f.value = value;
    f.addEventListener('change', () => commit(f.value));
    return f;
  };
  const page = el('div', { class: 'design' },
    field('Design name', 'input', design.name, { type: 'text', class: 'design-name' }, (v) => store.act.setName(v)),
    field('Intent', 'textarea', design.intent, { rows: '2', class: 'design-intent', placeholder: 'What is this design for? (optional)' }, (v) => store.act.setIntent(v)),
    el('p', { class: 'counts' },
      `${analysis.chosen.size} decided · ${undecided.length} undecided · `,
      el('span', { class: problems ? 'problems' : '' }, `${problems} ${problems === 1 ? 'problem' : 'problems'}`)));

  if (isEmpty(design)) {
    page.append(el('p', { class: 'hint' }, 'Nothing decided yet. Open a node in the graph and choose there.'));
  } else {
    const slot = el('div', { class: 'brief-slot' });
    page.append(slot);
    fillBrief(slot, graph, design);
  }

  if (analysis.conflicts.length) {
    page.append(el('h3', {}, 'Conflicts'),
      el('ul', { class: 'conflicts' }, ...analysis.conflicts.map(([a, b]) => el('li', {}, open(a), ' excludes ', open(b)))));
  }
  if (analysis.required.size) {
    page.append(el('h3', {}, 'Required, not chosen'),
      el('ul', { class: 'missing' }, ...[...analysis.required].map(([id, by]) =>
        el('li', {}, open(id), ` (required by ${by.map(title).join(', ')})`))));
  }
  if (analysis.chosen.size) {
    page.append(el('h3', {}, 'Decided'),
      el('ul', { class: 'decided' }, ...[...analysis.chosen].map(([fnId, solId]) => {
        const e = entryOf(design, fnId);
        return el('li', {}, open(fnId), ' → ', open(solId),
          e.shortlist.length ? el('small', {}, ` · also shortlisted: ${e.shortlist.map(title).join(', ')}`) : null);
      })));
  }
  if (undecided.length) {
    page.append(el('h3', {}, 'Undecided'),
      el('ul', { class: 'undecided' }, ...undecided.map((id) => {
        const e = entryOf(design, id);
        return el('li', {}, open(id), e.shortlist.length ? el('small', {}, ` · exploring: ${e.shortlist.map(title).join(', ')}`) : null);
      })));
  }

  const file = el('input', { type: 'file', accept: '.json,application/json', hidden: '', 'aria-label': 'Design file to import' });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    file.value = '';
    if (f) store.importText(await f.text());
  });
  const button = (text, fn, extra = '') => {
    const b = el('button', { type: 'button', class: extra }, text);
    b.addEventListener('click', fn);
    return b;
  };
  page.append(el('h3', {}, 'This design'),
    el('p', { class: 'hint' }, store.persistent
      ? 'Kept in this browser. Export it to keep a copy or move it to another machine.'
      : 'Not kept: browser storage is unavailable. Export it to keep a copy.'),
    el('p', { class: 'toolbar' },
      button('Export', () => download(design)),
      button('Import…', () => file.click()),
      button('New design', () => store.newDesign()),
      undoButton(store)),
    file);
  return page;
}
