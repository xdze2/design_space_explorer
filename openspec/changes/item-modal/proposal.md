# Proposal

## Why

The selection panel (left, always visible) does two jobs: toggling options and opening them. Opening an option navigates to the Browse page, which then shows the panel beside a second tree, and that is confusing. There is also no way to clear the selection or go back to a neutral start without editing the URL.

## What Changes

- The panel gets a **Reset** button (clears the selection, keeps the current page) and the app title links home (the Selection page with an empty selection).
- In the panel each option has two actions: toggle (as now) and **view**, which opens the node detail in a **modal** on top of the app instead of navigating.
- The modal shows the node detail now shown in Browse: title, type, confidence, body, `requires`/`excludes`/`compatible_with` links (which swap the modal to that node), sources, and the Select/Remove button for options. Esc, the close button or a click on the backdrop closes it.
- The open node is carried in the URL hash as `view=<id>`, independent of page and selection, so reload, sharing and the back button work.
- **Browse** becomes a full-width overview page without the selection panel: the whole graph as an expanded tree, chosen options marked, and every node opens in the same modal. **BREAKING**: the URL `#/browse/<id>` no longer selects a detail pane; it is read as Browse with `view=<id>`.
- Out of scope: new content in the modal, keyboard navigation inside the tree, animations.

## Capabilities

### New Capabilities
- `item-modal`: the node detail modal, the `view` hash parameter, the panel's view and reset actions, and the full-width Browse overview.

### Modified Capabilities
<!-- None in openspec/specs/. Depends on the `selection-page` change (panel, Selection page, hash format), which replaces its Browse-with-panel and "Browse selection button" requirements; archive that change first or sync both. -->

## Impact

- Changed: `viewer/hash.js` (`view` parameter, `#/browse` without id), `viewer/app.js` (modal host, panel only off Browse), `viewer/views/panel.js` (view link, Reset, home), `viewer/views/browse.js` (overview tree), `viewer/index.html`, `viewer/style.css`, `README.md`, tests.
- New: `viewer/views/modal.js`.
- No change to `graph.json`, the build, briefs or scripts.
