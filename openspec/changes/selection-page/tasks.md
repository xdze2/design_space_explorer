# Tasks

## 1. Hash and selection helpers

- [x] 1.1 Rewrite `viewer/hash.js` for `#/browse/<id>?pick=...` and `#/selection?pick=...` (default `#/selection`); `parseHash` returns `{ page, params, pick, unknown }`, `buildHash(page, params, pick)` keeps `pick`. Update `test/viewer.test.mjs`: round trips, `pick` kept on both pages, unknown ids reported. Verify with `npm test`
- [x] 1.2 Add `undecided(graph, selection)` to `viewer/select.js` and test it on the real `graph.json` (only `gantry/corexy` selected leaves 4 decisions undecided). Verify with `npm test`

## 2. Layout and panel

- [x] 2.1 Add `viewer/views/panel.js` (options by decision, excluded options disabled with the cause named, toggle links via `buildHash`, problem count badge linking to the Selection page) and change `app.js` to render the shell: panel plus main page, passing `pick` to pages. Remove `viewer/views/select.js`. Verify in the browser that the panel shows on both pages and that exclusion and replacement (`gantry/corexy` then `gantry/h-bot`) work
- [x] 2.2 Update `style.css` for the two-region layout (panel first in one column under 48rem, side by side above) and keep Browse columns usable inside the main region. Verify with headless Chrome screenshots at 400px and 1200px widths: no horizontal overflow

## 3. Selection page

- [x] 3.1 Add `viewer/views/selection.js`: conflicts, missing with select action, selected options (title, rendered body, sources, link to Browse), undecided decisions, empty state. Verify in the browser with `#/selection?pick=gantry/corexy` (missing `drive/gt2-belt`, four undecided) and `?pick=gantry/corexy,drive/leadscrew` (conflict)
- [x] 3.2 Check that reloading keeps page and selection and that `#/selection?pick=gantry/doesnotexist` shows the notice and still renders. Verify in headless Chrome DOM output

## 4. Browse integration

- [x] 4.1 Update `viewer/views/browse.js` so all links keep `pick`, and add the select / remove button for option nodes only. Verify that selecting from `#/browse/gantry/corexy` keeps the same node, that the panel shows it chosen, and that `gantry` (decision) shows no button
- [x] 4.2 Update the Viewer section of `README.md` (new hash format, pages) and verify the documented URLs load. Run `npm test` and `openspec validate selection-page`
