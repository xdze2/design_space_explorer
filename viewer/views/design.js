import { analyze, undecided, toggle } from '../select.js';
import { renderMarkdown } from '../markdown.js';
import { buildHash } from '../hash.js';
import { el } from '../dom.js';
import { buildDiagram, boxId } from '../diagram.js';
import { selectionKey, contentHash, buildPrompt, parseBrief } from '../brief.js';

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

// Cached brief for the selection, or null (a missing index means no briefs).
async function loadBrief(graph, pick) {
  const index = await fetchText('../briefs/index.json').then(JSON.parse, () => ({}));
  const entry = index[selectionKey(pick)];
  if (!entry) return null;
  const { meta, body } = parseBrief(await fetchText(`../briefs/${entry.file}`));
  return { meta, body, stale: meta.content_hash !== contentHash(graph, pick) };
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

async function fillBrief(slot, graph, pick) {
  const [brief, template] = await Promise.all([
    loadBrief(graph, pick).catch(() => null),
    fetchText('../prompts/brief.md').catch(() => null),
  ]);
  if (brief) {
    const body = el('div', { class: 'body' });
    body.innerHTML = renderMarkdown(brief.body);
    slot.append(el('section', { class: 'brief' },
      el('h3', {}, 'Brief'),
      el('p', { class: 'brief-meta' }, `Written by ${brief.meta.model ?? 'unknown'}`,
        brief.stale ? el('span', { class: 'stale' }, ' · stale: the selected options changed since this brief was written') : ''),
      body));
  } else {
    slot.append(el('p', { class: 'brief-none' }, 'No brief exists for this selection yet.'));
  }
  if ((!brief || brief.stale) && template) slot.append(promptBox(buildPrompt(template, graph, pick)));
}

const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
let mermaidLoad;

// Loaded once, on first Design render. A failure is not cached, so a later render can retry.
function loadMermaid() {
  mermaidLoad ??= import(MERMAID).then((m) => {
    m.default.initialize({ startOnLoad: false, securityLevel: 'strict' });
    return m.default;
  }).catch((e) => {
    mermaidLoad = null;
    throw e;
  });
  return mermaidLoad;
}

let renders = 0;

async function fillDiagram(holder, graph, route) {
  const source = buildDiagram(graph, route.pick);
  try {
    const mermaid = await loadMermaid();
    const { svg } = await mermaid.render(`diagram-${renders++}`, source);
    holder.innerHTML = svg;
    for (const d of graph.nodes.filter((n) => n.type === 'decision')) {
      const box = holder.querySelector(`[id*="flowchart-${boxId(graph, d.id)}-"]`);
      if (!box) continue;
      box.classList.add('clickable');
      box.addEventListener('click', () => {
        location.hash = buildHash('design', { pick: route.pick, view: d.id });
      });
    }
  } catch {
    holder.replaceChildren(
      el('p', { class: 'notice' }, 'The diagram could not be drawn (Mermaid failed to load). Showing its source.'),
      el('pre', {}, source));
  }
}

export function render(graph, { pick, view }) {
  const { missing, conflicts } = analyze(graph, pick);
  const title = (id) => graph.byId.get(id)?.title ?? id;
  const browse = (id) => el('a', { href: buildHash('design', { pick, view: id }) }, title(id));
  const page = el('div', { class: 'design' }, el('h2', {}, 'Design'));
  const holder = el('div', { class: 'diagram', 'aria-label': 'Block diagram of the design' }, 'Drawing the diagram…');
  page.append(holder);
  fillDiagram(holder, graph, { pick, view });

  if (!pick.length) {
    page.append(el('p', {}, 'Nothing selected yet. Click a box in the diagram, or open the ',
      el('a', { href: buildHash('graph', { pick }) }, 'Graph'), ' page, to start choosing.'));
  } else {
    const slot = el('div', { class: 'brief-slot' });
    page.append(slot);
    fillBrief(slot, graph, pick);
  }
  if (conflicts.length) {
    page.append(
      el('h3', {}, 'Conflicts'),
      el('ul', { class: 'conflicts' }, ...conflicts.map(([a, b]) =>
        el('li', {}, browse(a), ' excludes ', browse(b)))),
    );
  }
  if (missing.size) {
    page.append(
      el('h3', {}, 'Required, not selected'),
      el('ul', { class: 'missing' }, ...[...missing].map(([id, by]) =>
        el('li', {},
          el('a', { href: buildHash('design', { pick: toggle(graph, pick, id), view }) }, `Select ${title(id)}`),
          ` (required by ${by.map(title).join(', ')})`))),
    );
  }
  if (pick.length) {
    page.append(el('h3', {}, 'Chosen options'));
    for (const id of pick) {
      const node = graph.byId.get(id);
      const body = el('div', { class: 'body' });
      body.innerHTML = renderMarkdown(node.body ?? '');
      page.append(el('article', { class: 'chosen-option' },
        el('h4', {}, node.title, ' ', el('small', {}, `(${graph.byId.get(node.parent)?.title ?? node.parent})`)),
        body,
        el('p', { class: 'sources' }, 'Sources: ', (node.sources ?? []).join('; ') || 'none', ' · ', browse(id)),
      ));
    }
  }
  const open = undecided(graph, pick);
  if (open.length) {
    page.append(
      el('h3', {}, 'Undecided'),
      el('ul', { class: 'undecided' }, ...open.map((d) => el('li', {}, browse(d.id)))),
    );
  }
  return page;
}
