# Proposal

## Why

The Graph page shows the whole hierarchy as one fully expanded tree. That stops working as the graph grows deeper and starts to have nodes with several parents (see `graph-links-storage`): the tree is long, it hides where a node sits between "why" (up) and "how" (down), and it would repeat shared nodes everywhere. Exploring a topic needs a focused view around one node, with the abstraction levels visible.

## What Changes

- Replace the Graph page's tree with an **outline** centred on the open node (`view`; the root when none): one line per node, with the ancestors listed above as a mirrored tree and the descendants listed below as a normal tree.
- A **depth cut** limits how far the outline goes from the focus: by default 3 levels up and 2 levels down. Cut branches end in a `+N more` line that shows two more levels.
- **Multiple parents** are shown naturally: each parent is a line above the focus, each with its own ancestors; a node reached by several paths is shown under each, but its own relatives are listed only once and the other occurrences are marked as repeats.
- Each line shows the title, a mark when the option is chosen, and **badges** for its `requires`, `excludes` and `compatible_with` links that focus the target when clicked.
- The levels are two hash parameters, `up` and `down`, kept only while the focus stays the same; moving to another node resets them to the defaults.
- The viewer reads `parents` and falls back to `parent`, so the outline works before and after `graph-links-storage`.

Out of scope:
- Changing selection rules, the Design page, or the node pane for nodes with several parents.
- A layered (left-to-right) graph drawing, a depth gutter, keyboard navigation, search or filters.
- Editing the graph from the viewer.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `graph-viewer`: the Browse view becomes a focus outline with a depth cut, and the hash gains `up` and `down`.
- `design-page`: places that name "the Graph tree" now name the outline; the routes requirement lists the new parameters.

## Impact

- New `viewer/outline.js`: a pure function from `(graph, focus, up, down)` to a list of rows, tested without a browser.
- `viewer/views/graph.js` renders the rows; `viewer/hash.js` parses and builds `up` and `down`; `viewer/style.css` styles the outline (the `ul.tree` rules go away).
- `test/viewer.test.mjs` gains outline and hash tests; `README.md` describes the Graph page.
- No change to `graph.json`, the build or the tool. It reads `parents` from `graph.json`, so it fits best after `graph-links-storage`, but does not require it.
