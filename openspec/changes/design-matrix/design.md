## Context

`visibleRows(graph, design, analysis, route)` in `viewer/outline.js` builds the graph panel's lines for one design: preorder from the root, and below a function only the sub-functions of its chosen solution (plus a peeked solution's, dormant). So the rows depend on the design. `clean()` and `analyzeDesign()` in `viewer/design.js` already load an untrusted design file and compute chip states. `scripts/brief.mjs` keeps a `briefs/index.json` and the app is a static page with no server logic.

There is no view switcher in the viewer, only the graph panel and the node panel.

## Goals / Non-Goals

**Goals:**
- Compare the catalogue's designs in one table, with rows identical in order and look to the graph view.
- Narrow the catalogue with "uses node X" filters.

**Non-Goals:**
- Creating or editing designs, other filter kinds, sorting, persistence of filters beyond the URL.

## Decisions

- **Separate page `matrix.html`** instead of a mode of `index.html`: the main page is a two-panel layout around one editable design, which the matrix does not have. Both pages link to each other and share the ES modules. Topic comes from `?topic=` as in `app.js`.
- **Index written by the build**: `npm run build [topic]` also lists `designs/*.design.json` (sorted by file name) into `designs/index.json` as `{ "designs": ["easydraw-v4.design.json", ...] }`. The page cannot list a folder from a static host, and the existing `briefs/index.json` sets the precedent. A missing or empty `designs/` gives an empty list, not an error.
- **Rows = union of per-design rows.** For each kept column, call `visibleRows` with an empty route (nothing folded or peeked), drop dormant rows (no peeking in the matrix), and merge by node id keeping the graph's preorder: walk the graph's preorder once and keep nodes that appear in at least one column. A function appearing under different parents in different designs is shown once, at its first place in the merged order; depth comes from the first column that has it. Constraint rows come last, as in the graph view. Folding is by row id, kept in the URL as `fold=`, and hides the rows under a folded row in all columns.
- **Usage set per design**: `used(design)` = ids of chosen solutions, plus the `how` targets (components, transitively through components) of each chosen solution. A node is "used" if it is in that set. Rejected or shortlisted solutions do not count. This answers "uses stepper motors" for both a solution node and a component node.
- **Cells**: function row with solutions: the chosen solution as a chip with `chipState` styling (reused CSS classes), or the function's status mark if nothing is chosen; row not visible in that design: dim `—`; component row: ✓ if in the usage set; constraint row: the design's value text (truncated, full text in the title). A row is "differing" when its cell values are not all equal across kept columns; the marker is a thin bar in the row's left edge.
- **Filters**: chips in a bar above the table. The picker lists solution and component nodes grouped by type, each with the number of catalogue designs that use it; picking adds a chip, removing a chip drops it. Filters are in the URL (`use=<id>,<id>`) so a view can be shared. A filter id that is not a solution or component is ignored with a notice. A design is kept when it uses every filter node. With no match the page says so and offers to clear the filters.
- **Pure model, thin view**: `viewer/matrix-model.js` has no DOM (columns, usage, rows, differences, filter counts) and is tested with `node --test`; `viewer/matrix.js` renders.
- **Loading**: each design file goes through `clean(graph, raw)`; a file that is not a design, or is another topic's, becomes a visible notice and no column. Dropped items from `clean` are listed in a notice as well.

## Risks / Trade-offs

- A function under different parents in different designs shows at one place only: acceptable for a first version, since in this graph a function normally has one parent.
- The index must be rebuilt after adding a design file: `npm run build` already is the step after ingesting, and a repo test checks the index matches the folder.
- No-JS fallback and mobile layout are not handled beyond horizontal scroll of the table.
