# Tasks

## 1. Hash and modal

- [x] 1.1 In `viewer/hash.js`, add the `view` parameter to `parseHash`/`buildHash` (`{ page, pick, view, unknown }`, Browse without a path id, legacy `#/browse/<id>` read as `view=<id>`, unknown view id reported and dropped). Update `app.js` and the views to the new shape. Update the hash tests in `test/viewer.test.mjs` and add cases for `view`, legacy browse links and unknown ids. Verify with `npm test`
- [x] 1.2 Add `viewer/views/modal.js` (moved `detail()`, close button, backdrop click, Esc, `role="dialog"`, edge links using `location.replace`, select button keeping `view`) and mount it from `app.js` when `view` is set, with styles in `style.css`. Verify in headless Chrome: opening `#/selection?view=gantry/corexy` shows the modal over the Selection page, Esc and backdrop close it, the select button toggles and keeps the modal, no button on `gantry`

## 2. Panel and pages

- [x] 2.1 In `viewer/views/panel.js` add the view action per option (excluded rows included), the Reset link (empty pick, same page and view) and make the header title a link home. Verify in headless Chrome: toggle does not open the modal, Reset empties the selection on Selection and on Browse, home gives `#/selection`
- [x] 2.2 Rewrite `viewer/views/browse.js` as a full-width expanded tree with chosen marks and links to `view=<id>`; render the panel only for the Selection page; remove the old detail pane. Update the nav links in `app.js` and `index.html`. Verify in headless Chrome: no panel on Browse, a tree node opens the modal, `#/browse/gantry/corexy` shows Browse with the modal, the selection survives switching pages

## 3. Docs

- [x] 3.1 Update the Viewer section of `README.md` (modal, `view` parameter, Reset, Browse overview, URL forms). Run `npm test` and `openspec validate item-modal`
