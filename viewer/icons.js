import { el, svg } from './dom.js';

// One small inline SVG per node type, drawn in a 12x12 box with currentColor, so the page theme and the row state colour it.
// function: circle ring (a goal), solution: filled diamond (a choice), component: small square (a part), constraint: triangle (a limit).
const SHAPES = {
  function: () => svg('circle', { cx: 6, cy: 6, r: 4.2, fill: 'none', 'stroke-width': 1.8 }),
  solution: () => svg('path', { d: 'M6 1 L11 6 L6 11 L1 6 Z', fill: 'currentColor', 'stroke-width': 1 }),
  component: () => svg('rect', { x: 3, y: 3, width: 6, height: 6, rx: 1, fill: 'currentColor', 'stroke-width': 0 }),
  constraint: () => svg('path', { d: 'M6 1.5 L11 10.5 L1 10.5 Z', fill: 'none', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
};

export const TYPE_NAMES = Object.keys(SHAPES);

export function typeIcon(type) {
  return svg('svg', { class: `type-icon ${type}`, viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', stroke: 'currentColor' }, SHAPES[type]?.());
}

// Solution chip states: a text mark besides the colour, so they differ without it. Order = priority.
export const CHIP_STATES = {
  chosen: { mark: '✓', text: 'chosen' },
  rejected: { mark: '✕', text: 'rejected' },
  excluded: { mark: '⊘', text: 'excluded by a choice' },
  required: { mark: '+', text: 'required by a choice' },
  shortlisted: { mark: '★', text: 'shortlisted' },
  open: { mark: '', text: 'open' },
};
export const STATUS_MARKS = { open: '○', exploring: '◐', decided: '●' };

// Legend pinned to the bottom of the graph panel: the four type icons, the chip states and the function statuses.
export function legend() {
  return el('div', { class: 'legend', 'aria-label': 'Legend' },
    el('strong', { class: 'legend-title' }, 'Legend:'),
    ...TYPE_NAMES.map((t) => el('span', { class: `legend-item ${t}` }, typeIcon(t), t)),
    el('div', { class: 'legend-chips' },
      ...Object.entries(CHIP_STATES).map(([state, { mark, text }]) =>
        el('span', { class: `chip ${state} legend-chip` }, mark ? el('span', { class: 'mark', 'aria-hidden': 'true' }, mark) : null, text)),
      el('span', { class: 'conflict-mark legend-chip' }, '⚠ conflict'),
      ...Object.entries(STATUS_MARKS).map(([s, m]) => el('span', { class: `status ${s}` }, `${m} ${s}`))));
}
