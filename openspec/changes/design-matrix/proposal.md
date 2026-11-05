## Why

The viewer shows one design at a time, the user's own, in the browser. We now want to build and compare designs of existing pen plotters (AxiDraw, EasyDraw, ...), saved as files under `topics/<topic>/designs/`. There is no way to see them side by side, nor to narrow them down ("only those using stepper motors").

## What Changes

- A new page, `viewer/matrix.html`, shows a catalogue of designs as a matrix: rows are the graph's tree, columns are the saved designs.
- The build writes `topics/<topic>/designs/index.json` listing the design files, so the static page can find them.
- Filters of the form "uses node X" narrow the columns; several filters combine with AND. The filter list comes from the graph, with a count of matching designs.
- A link between the graph page and the matrix page.
- The matrix has no "working design" column: it only reads the saved files. It is read-only.

Out of scope: creating or editing designs from the matrix, merging a catalogue design into the working design, other filter kinds (constraint values, scores), sorting columns, and any change to the existing graph view and editing UI.

## Capabilities

### New Capabilities
- `design-matrix`: the designs index, the matrix page (rows, columns, cells, differences) and the "uses node" filters.

### Modified Capabilities

None.

## Impact

- `scripts/build-graph.mjs` (index file), `scripts/serve.mjs` only if it needs to serve the new page (it already serves the folder).
- New `viewer/matrix.html`, `viewer/matrix.js`, `viewer/matrix-model.js` (pure: columns, rows, usage, filters), small additions to `viewer/style.css` and one link in `viewer/index.html`.
- Reuses `viewer/outline.js`, `viewer/design.js` (`clean`, `analyzeDesign`, `chipState`) unchanged.
- Tests in `test/`.
