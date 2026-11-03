# Tasks

## 1. Slot in the data

- [ ] 1.1 In `scripts/build-graph.mjs`, validate `slot` (non-empty string when present, error names the node) and keep it in the output. Add tests in `test/build-graph.test.mjs` (passed through, invalid, absent)
- [ ] 1.2 Add `slot` to the five decision files in `graph/` (Motion: gantry, drive, linear-guide; Tool: pen-lift; Electronics: controller), run `npm run build`, run `npm test`

## 2. Routing and tray

- [ ] 2.1 In `viewer/hash.js`, use pages `design` (default) and `graph`, read `#/selection` and `#/browse[/id]` as aliases, always write new names. Update `app.js` nav and the hash tests in `test/viewer.test.mjs` (default, aliases, legacy browse id, unknown ids)
- [ ] 2.2 Add `viewer/views/tray.js` (chips with remove, undecided count, problems count, Reset) mounted on every page in `app.js`; delete `views/panel.js`. Verify in headless Chrome: same tray on both pages, remove chip, Reset keeps the page, counts for `gantry/corexy` alone are 4 and 1

## 3. Node view

- [ ] 3.1 Replace `views/modal.js` with `views/node.js`: same detail and edge links, choose action for options, and for decisions the option list with choose actions, disabled excluded options with their cause. Follow-edge links replace the hash entry
- [ ] 3.2 Mount it as a drawer (two-column grid, close link and Esc) on Design and as the main pane beside the tree on Graph; rename `views/browse.js` to `views/graph.js` (tree marks chosen, links to `view=<id>`). Remove the modal styles, add drawer and layout styles. Verify in headless Chrome: drawer keeps the page visible, Graph shows no overlay, Esc closes, choosing from `gantry` replaces the option, `drive/leadscrew` disabled under CoreXY

## 4. Design page and diagram

- [ ] 4.1 Add `viewer/diagram.js` with `buildDiagram(graph, pick)` (slot subgraphs, decided and undecided boxes, solid requires edges, dashed `excludes`, dotted `needs`, escaped labels). Add tests in `test/viewer.test.mjs` for slots as groups, decided vs undecided, each edge kind and escaping
- [ ] 4.2 Rename `views/selection.js` to `views/design.js`: diagram first (lazy Mermaid load from a pinned jsdelivr version, `securityLevel: 'strict'`, box click opens the decision in the drawer, source in `<pre>` with a notice on failure), then the existing brief area, conflicts, missing, undecided and chosen options. Verify in headless Chrome, online and with the script blocked
- [ ] 4.3 Check phone width (about 400px): tray wraps, Graph stacks, drawer full width, only the diagram scrolls horizontally

## 5. Docs

- [ ] 5.1 Update the Viewer section of `README.md` (views, tray, drawer, `slot`, URL forms). Run `npm test` and `openspec validate design-page-views`
