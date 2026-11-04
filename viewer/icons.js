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

// Legend shown at the top of the graph panel.
export function legend() {
  return el('div', { class: 'legend', 'aria-label': 'Legend' },
    ...TYPE_NAMES.map((t) => el('span', { class: `legend-item ${t}` }, typeIcon(t), t)));
}
