# Tasks

## 1. Outline rows

- [x] 1.1 Create `viewer/outline.js` with `outlineRows(graph, focusId, { up = 3, down = 2 })` as described in design.md: descendants in preorder with per-side repeats and `more` rows, ancestors walked over `parents` (fallback `[parent]`) and reversed, focus row between them, root focus has no ancestors. Add tests in `test/viewer.test.mjs` on small hand-built graphs (a tree, a node with two parents each with a parent, a node under two decisions, a deep chain) covering every scenario of the `Outline rows` and `Outline depth cut` requirements: row order and levels, first parent adjacent to the focus, repeat marking with no relatives, `hidden` counts, no `more` row when nothing is hidden. Verify with `npm test`

## 2. Hash parameters

- [x] 2.1 In `viewer/hash.js`, parse `up` and `down` (integers 0 to 20, invalid or missing gives 3 and 2) into the route, and let `buildHash` take optional `up` and `down` and omit those equal to the default. Add tests: parse valid, invalid (`abc`, `-2`, `99`), build omits defaults, and an existing call without them gives the same hash as before. Verify with `npm test`

## 3. Graph page

- [x] 3.1 Rewrite `viewer/views/graph.js` to render `outlineRows` as `<ul class="outline">` beside the node pane: indentation from the level, the focus row highlighted, `✓` for chosen options, repeats labelled, "Why" and "How" section lines around the focus, `more` lines linking to the same focus with the one depth raised by two, rows linking to `buildHash('graph', { pick, view: id })`. Remove the `ul.tree` rules from `viewer/style.css` and add the outline styles (indent via `--level`, wrapping on narrow screens). Verify with `npm test` and by hand: `npm run serve`, open the Graph page, activate rows and `more` lines, check the hash changes as specified and that the page does not scroll horizontally at 400px width
- [x] 3.2 Add link badges to rows: one per `requires`, `excludes` and `compatible_with` target, showing kind and target title, linking to the target with `buildHash('graph', { pick, view: target })`, without changing line order. Add a pure helper for the badge list in `viewer/outline.js` with a test (a node with two kinds, a node with none). Verify with `npm test` and by hand: the CoreXY row shows its `excludes` badge and activating it opens the leadscrew node

## 4. Documentation

- [x] 4.1 Update `README.md`: the Graph page description (outline around the open node, mirrored ancestors, depth cut, badges) and the `up` and `down` hash parameters with one example URL. Verify by opening the documented example URL and seeing the described outline

## Workflow follow-up

- Best applied after `graph-links-storage` (multi-parent nodes only exist once it lands), but it does not depend on it.
- Archive the change once the manual check in 3.1 is done.
