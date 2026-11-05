## 1. Designs index

- [ ] 1.1 In `scripts/build-graph.mjs`, write `topics/<topic>/designs/index.json` (`{ "designs": [...] }`, `*.design.json` only, sorted; empty list when the folder is missing). Verify: build test for the sorted list, the empty case, and that other files are not listed.
- [ ] 1.2 Add to `test/repo.test.mjs` a check that the committed index matches the folder; run `npm run build` to create the index. Verify: `npm test` passes.

## 2. Model

- [ ] 2.1 `viewer/matrix-model.js`: `usedNodes(graph, design)` (chosen solutions plus their components, transitively). Verify: unit tests for a chosen solution, a component under it, and a shortlisted solution not counting.
- [ ] 2.2 `keepDesigns(graph, designs, filters)` and `filterCounts(graph, designs)` (solutions and components grouped by type). Verify: tests for one filter, two filters (AND), no match, and counts.
- [ ] 2.3 `matrixRows(graph, columns, fold)`: merge `visibleRows` of the kept columns, drop dormant rows, graph preorder, constraints last, hidden counts. Verify: tests for the union, the shrink when a column is removed, and folding.
- [ ] 2.4 `cellOf(...)` and `differs(...)`: chosen chip, status, tick, constraint text, "not applicable", and the differing-row flag. Verify: tests for each cell kind and for one column marking nothing.

## 3. Page

- [ ] 3.1 `viewer/matrix.html` and `viewer/matrix.js`: load the graph, the index and each design through `clean`; notices for bad files and dropped items; render columns, rows (indent, icon, fold control, name link to `index.html#/?view=<id>`) and cells with the existing chip classes. Verify: open `npm run serve` at `/viewer/matrix.html` with two fixture designs.
- [ ] 3.2 Filter bar: picker grouped by type with counts, removable chips, `use=` in the URL, notice for unknown ids, the empty-result message with a clear button. Verify: manual run, plus a viewer test for the URL parse.
- [ ] 3.3 Differing-row marker and the dim "—" style in `viewer/style.css`; horizontal scroll with a sticky first column. Verify: visual check at desktop and phone width.
- [ ] 3.4 Link from `viewer/index.html` (and its header) to the matrix page and back. Verify: both links keep the `topic` parameter.

## 4. Wrap-up

- [ ] 4.1 Put two real designs in `topics/pen_plotter/designs/` (the EasyDraw one from the `ingest-skill` change, and a second), rebuild the index and look at the matrix. Verify: filters "uses Stepper motors" and "uses CoreXY" behave as expected; `npm test` passes.
- [ ] 4.2 Document the matrix page and the index in `README.md`. Verify: the README describes `npm run build` writing the index.
