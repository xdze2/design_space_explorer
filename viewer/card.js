import { el } from './dom.js';

// A catalog card for a solution or component: picture or tile, title, summary, tradeoff badges, then the optional
// state and controls. The same card without the title is the header of the node panel.

const SKIPPED = new Set(['a', 'an', 'and', 'the', 'of', 'on', 'over', 'to', 'with']);

// Tile text from a title: initials of up to four words, a word with a digit kept whole, a one-word title gives two letters.
export function abbreviation(title) {
  const words = String(title).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const kept = words.filter((w) => !SKIPPED.has(w.toLowerCase()));
  const used = (kept.length ? kept : words).slice(0, 4);
  const text = used.length === 1 ? used[0].slice(0, 2) : used.map((w) => (/\d/.test(w) ? w : w[0])).join('');
  return text.toUpperCase().slice(0, 4);
}

export const tileLabel = (node) => node.abbr ?? abbreviation(node.title);

export const tile = (node) => el('span', { class: 'tile', 'aria-hidden': 'true' }, tileLabel(node));

const MARKS = { 2: '++', 1: '+', '-1': '−', '-2': '−−' };
const WORDS = { 2: 'much better on', 1: 'better on', '-1': 'worse on', '-2': 'much worse on' };

// The node's fares as badge data, best first, then by constraint title.
export function badges(graph, node) {
  return (node.fares ?? [])
    .filter((f) => graph.byId.has(f.id))
    .map((f) => ({ id: f.id, title: graph.byId.get(f.id).title, score: f.score, mark: MARKS[f.score], words: WORDS[f.score] }))
    .sort((a, b) => b.score - a.score || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
}

function picture(graph, node) {
  const box = el('span', { class: 'pic' });
  if (!node.img) {
    box.append(tile(node));
    return box;
  }
  const img = el('img', { src: `${graph.base}knowledge_graph/img/${node.id}.svg`, alt: '', loading: 'lazy' });
  img.addEventListener('error', () => img.replaceWith(tile(node)));
  box.append(img);
  return box;
}

// opts: at(id) -> href; header: omit the title (the panel has its own); chip: the node's state under a function
// (sets the card's class); state: nodes for the state line; controls: an element for the buttons.
export function card(graph, node, { at, header = false, chip = null, state = null, controls = null }) {
  const marks = badges(graph, node);
  return el('div', { class: `card ${chip?.state ?? ''}`.trim() },
    picture(graph, node),
    el('div', { class: 'card-main' },
      header ? null : el('a', { class: 'card-title', href: at(node.id) }, node.title),
      node.summary ? el('p', { class: 'summary' }, node.summary) : null,
      marks.length
        ? el('p', { class: 'badges' }, ...marks.map((b) => el('a', { class: `badge ${b.score > 0 ? 'good' : 'bad'}`, href: at(b.id), title: `${b.words} ${b.title}` },
          el('span', { class: 'mark' }, b.mark), ` ${b.title}`)))
        : null,
      state ? el('p', { class: 'state' }, ...state) : null,
      controls));
}
