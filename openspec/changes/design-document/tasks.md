# Tasks

## 1. Design document model (pure)

- [x] 1.1 Create `viewer/design.js` with `emptyDesign()` (fresh id, "Untitled design"), the entry defaults and `decisions()` moved from `select.js`; verify with a test that a new design has no entries and an unknown function reads as `open`
- [x] 1.2 Add `clean(graph, raw)` returning `{ design, dropped }`: rejects non-JSON-object / missing `functions`, drops unknown ids, solutions under the wrong function, chosen-and-rejected or shortlisted-and-rejected pairs, empty reasons, and recomputes `status`; verify with tests for the wrong-function and unknown-id scenarios
- [x] 1.3 Add the pure actions (choose, unchoose, shortlist, unshortlist, reject with reason, unreject, setNotes, setConstraint, setName, setIntent); verify with tests for Choose, Replace a choice (old choice goes to shortlist), Shortlist while open, Unchoose, and Reject needs a reason
- [x] 1.4 Add `analyzeDesign(graph, design)` (active set, chosen, excluded, required, conflicts, missing, undecided) and `chipState()`; verify with tests for Excluded, Choosing an excluded solution, Dormant entry kept / Back again, and Counts on the demo graph
- [x] 1.5 Add `whatIf(graph, design, solId)` and `whyPath(graph, analysis, id)` (breadcrumb through active choices, else first why); verify with tests for Preview a replacement, Preview a conflict and the Shared function breadcrumb

## 2. Store, storage and undo

- [x] 2.1 Create `viewer/store.js`: current design, `apply(action)`, capped undo stack, save to `localStorage` in try/catch, load with `clean()` and a notice on drop or storage failure; verify with a node test using a fake storage (reload round trip, storage that throws, undo of two choices, undo of New design)
- [x] 2.2 Add export (`<slug>.design.json`) and import (file input → `clean()` → undoable replace, error notice on bad file); verify the round trip with a `clean()` test and by hand in the browser

## 3. Hash and graph panel

- [x] 3.1 Rewrite `viewer/hash.js` for `view`, `fold`, `peek`, legacy routes, and a `pickIgnored` flag; update `test/viewer.test.mjs` hash tests (old pick link, unknown id, obsolete parameters, legacy browse) and verify they pass
- [x] 3.2 Replace `outlineRows` / `crossLinks` in `viewer/outline.js` with `visibleRows()` (chosen subtree, peeked dormant subtree, one peek per function, fold with hidden count, repeats, open node kept visible, constraints last); verify with tests for Nothing chosen, Chosen solution expands, Components of a choice, Peek / Unpeek, Collapse a function, Open a hidden function, and a repeat on a small graph
- [x] 3.3 Rewrite `viewer/views/graph.js`: function lines with chips (state class + text/shape marker, tooltip cause, conflict mark), status marks, collapse and peek toggles as hash links, every click only opens; drop the SVG lane; update legend in `viewer/icons.js` with chip states; check in the browser that clicking chips never changes the design

## 4. Node panel and overview

- [x] 4.1 Change `viewer/index.html` and `viewer/app.js` to the two-panel shell with no modal: right panel renders node or overview, re-render on hashchange and store change, Esc / close go back to the overview, node panel scrolls to top on a new node, graph panel keeps scroll; verify by hand and that `npm test` passes
- [x] 4.2 Rewrite `viewer/views/node.js` as the node panel: breadcrumb, header with icon, body and sources, context, implications, status in the design, what-if preview; verify by opening CoreXY, Leadscrew drive (excluded by CoreXY) and an inactive function in the browser
- [x] 4.3 Add the edit controls in the node panel (Choose / Unchoose, Shortlist / Unshortlist, Reject with inline reason / Unreject, per-solution buttons on a function, notes field, constraint value field, Undo) committing on confirm or change; verify the Edit buttons scenarios by hand and that reload keeps the edits
- [x] 4.4 Turn `viewer/views/main.js` into `viewer/views/overview.js`: editable name and intent, counts, brief slot, conflicts and missing with links, decided and undecided lists, Export / Import / New design / Undo, empty-design hint; verify Empty selection, Counts and Reset scenarios by hand
- [x] 4.5 Update `viewer/style.css` for the panel, chips (states not by color alone), dormant lines, fold count and narrow-screen stacking (node panel first when open); verify at ~400px width that the body does not scroll horizontally
- [x] 4.6 Delete `viewer/select.js` and remove its tests; verify `npm test` passes and nothing imports it

## 5. Briefs on the design

- [x] 5.1 Update `viewer/brief.js`: `designKey`, `contentHash(graph, design)`, `buildPrompt(template, graph, design)`; bump `prompts/brief.md` to version 3 with design, explored (shortlists, rejections with reasons, notes) placeholders; update the brief tests in `test/viewer.test.mjs` (prompt content, stale after edit, unchanged hash after navigation-only changes)
- [x] 5.2 Update `scripts/brief.mjs` to `brief save <design.json> <brief.md> [--model]` writing `briefs/<design id>.md` and the index; update `test/brief.test.mjs` (save, replace, unknown id writes nothing) and verify they pass
- [x] 5.3 Wire the overview brief slot to the design key and hash, with prompt offered only for a non-empty design; verify by saving a brief for an exported design and seeing it fresh, then stale after a choice

## 6. Docs and integration

- [x] 6.1 Update README (how to choose, export/import, brief command) and replace `docs/node-modal.png` / `docs/selection.png` with new screenshots; verify the README commands run as written
- [x] 6.2 End-to-end check in the browser with `npm run serve`: build a design on the demo graph, reload, export, New design, import, undo; and `npm test` passes
