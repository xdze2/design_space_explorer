# Design

## Context

`viewer/views/graph.js` renders the whole tree recursively from `children` as nested `<details>`, next to the node pane (`views/node.js`). Routing is in `viewer/hash.js` (`page`, `pick`, `view`) and `viewer/app.js`; pages are pure functions `(graph, route) -> DOM`. Node links to other nodes call `buildHash(page, { pick, view })`. Tests run the pure modules under `node --test` without a browser (`test/viewer.test.mjs`). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A focused, one-line-per-node outline that works the same for trees and DAGs.
- The row computation is a pure function, so the layout rules are covered by plain tests.

**Non-Goals:**
- New selection semantics for multi-parent nodes, a graph drawing, a depth gutter, keyboard navigation.

## Decisions

**Rows come from a pure function.** `viewer/outline.js` exports `outlineRows(graph, focusId, { up, down })` returning an array of `{ id, kind, level, repeat, hidden }`:
- `kind` is `up`, `focus`, `down` or `more` (a hidden-nodes line).
- `level` is the distance from the focus (0 for the focus); indentation is `level`.
- `repeat` marks a second appearance of a node on the same side.
- `hidden` (on `more` rows only) is the number of distinct nodes behind the cut, and `side` says which direction the line expands.
`views/graph.js` only maps rows to elements. This keeps all layout rules testable without DOM.

**Descendants: preorder over `children`.** Children are already sorted by title in `graph.json`. A node already shown on this side is emitted again as a `repeat` row with no descendants. A node at level `down` that has children is followed by a `more` row at `level + 1` whose `hidden` counts the distinct descendants not shown; with no children there is no `more` row.

**Ancestors: the same walk over `parents`, emitted reversed.** Walk from the focus with `parents` (first parent first) in preorder, then reverse the list. In the reversed list each parent has its own ancestors directly above it and the first parent is the line directly above the focus. The `more` line for ancestors sits above a node at level `up` that still has parents, with `hidden` counting its distinct ancestors. `parents` falls back to `[parent]` when absent, so the view works with a `graph.json` built before `graph-links-storage`.
*Alternative:* indentation by absolute depth, ancestors printed as a pruned top-down outline. Rejected: with several parents the focus would be repeated under each, and the focus would move around the screen.

**Repeats are per side, not global.** A node that is both an ancestor and a descendant cannot exist (the hierarchy is acyclic), but a node can be reached on several paths on one side. Counting repeats per side is enough and keeps the rule simple to state.

**Depths in the hash: `up` and `down`.** Non-negative integers, defaults 3 and 2, capped at 20; anything else falls back to the default. `buildHash` takes optional `up` and `down` and omits a value equal to its default. Existing callers (the node pane's edge links, the header, the tray) pass neither, so moving to another node resets the depths with no extra code. The `more` lines build their link from the current route with the one depth raised by two.
*Alternative:* one `depth` for both directions. Rejected: ancestors are usually few and descendants many, so they want separate cuts.

**Rendering.** Each row is a `<li>` in a plain `<ul class="outline">`; a CSS custom property (`--level`) sets the indent. The focus row is highlighted; chosen options get the existing `chosen` mark; repeats are dimmed with a "repeat" label; badges are small links (`requires`, `excludes`, `compatible with`) after the title. `<details>` is not used: expansion is the depth cut, which is also in the URL. Rows wrap on narrow screens (no horizontal scroll). The old `ul.tree` rules are removed.

**Whole-graph overview is dropped.** The old page showed every node at once. With the default depths the outline of the root shows the decisions, which is the same overview for the demo; a bigger `down` reproduces the full tree.

## Risks / Trade-offs

- [Many rows when the focus has many descendants] → the cut keeps the default small; `more` lines grow it two levels at a time.
- [Mirrored ancestors may confuse at first, as indentation grows upward] → section lines "Why" above and "How" below the focus row, and the focus row visually distinct; revisit with a depth gutter if it still reads badly.
- [Resetting depths on every node move loses a chosen depth] → accepted for simplicity; deep exploration can come back through the `more` lines.
- [Diamonds make ancestors lists long] → repeats are not expanded.
