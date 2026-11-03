# Tasks

## 1. Skeleton and serving

- [x] 1.1 Add `scripts/serve.mjs` (static server over the repo root) and an `npm run serve` script. Verify with `curl` that `/graph.json` and `/viewer/index.html` return 200 and that the command prints the URL
- [x] 1.2 Add `viewer/index.html`, `viewer/app.js` (load `graph.json`, hash router, error message when loading fails) and a minimal stylesheet. Verify in the browser that the page loads and that a broken `graph.json` shows the error message

## 2. Shared helpers

- [x] 2.1 Add `viewer/markdown.js` (escape HTML, then paragraphs, bold, inline code, lists) with a `node:test` test including an HTML-injection case
- [x] 2.2 Add `viewer/hash.js` to parse and build the hash (`#/browse/<id>`, `#/select?pick=a,b`) with `node:test` tests, including unknown ids being reported

## 3. Browse view

- [x] 3.1 Add `viewer/views/browse.js`: expandable tree and detail pane (title, type, confidence, rendered body, sources, edges as links). Verify in the browser by opening `gantry/corexy` and following the `drive/gt2-belt` link
- [x] 3.2 Make the tree expand to reveal the selected node and highlight it. Verify with a deep link to `#/browse/drive/leadscrew`

## 4. Select view

- [x] 4.1 Add `viewer/select.js` with pure functions `toggle(selection, id)` (one option per decision), `analyze(graph, selection)` returning `excluded`, `missing`, `conflicts`. Add `node:test` tests against the real `graph.json`: one per scenario in the spec
- [x] 4.2 Add `viewer/views/select.js`: options grouped by decision, excluded options disabled with the responsible node named, missing list with a select action, conflicts list. Verify in the browser with the scenarios `gantry/corexy` then `drive/leadscrew`, and the replacement of `gantry/corexy` by `gantry/h-bot`
- [x] 4.3 Check that reloading keeps the selection and that a hash with an unknown id shows a notice

## 5. Wrap-up

- [x] 5.1 Add a "Viewer" section to `README.md` (command, URL, hash format) and verify the documented command works as written
- [x] 5.2 Use both views for a while and record friction and schema gaps in `design.md` under a "Findings" heading. Run `npm test` and `openspec validate static-graph-viewer`
