# Proposal

## Why

The first viewer showed that Browse (node by node) is a raw inspection tool, not the interface a person builds a design with. Select works, but as a separate page it cannot be used while reading, and nothing shows the selection as a whole: what was chosen, why, what is still open. The next step toward the building assistant is a persistent filter panel plus a page that presents the current selection.

## What Changes

- Turn the Select view into a **left panel shown on every page**: options grouped by decision, excluded options disabled with the responsible node named, one option per decision.
- Add a **Selection page** (the main area when no node is being browsed) showing:
  - the chosen options, each with its rendered prose and sources;
  - the decisions still undecided;
  - the required-but-unselected nodes, with a select action;
  - the conflicts between chosen options.
- Keep **Browse** as the raw node view, reachable from the header and from links on the Selection page. Add a "select this option" / "remove from selection" button to option nodes in its detail pane.
- URL hash carries both the main page and the selection, so they are independent: e.g. `#/selection?pick=a,b` and `#/browse/<id>?pick=a,b`. **BREAKING**: `#/select?pick=...` is replaced by `#/selection?pick=...`.
- Move the selection logic (`toggle`, `analyze`) unchanged; add the list of undecided decisions.

Out of scope:
- Changes to the node format or build script, cost or parts totals, and `compatible_with` reasoning.
- Multi-select, alternatives in `requires` ("one of"), and any solver.
- Saving selections outside the URL, and runtime LLM calls.
- Visual polish beyond a layout that collapses to one column on a phone-width screen.

## Capabilities

### New Capabilities
- `selection-workspace`: a persistent selection panel and a Selection page presenting the current selection, with the selection encoded in the URL hash on every page.

### Modified Capabilities
<!-- None in openspec/specs/. The change static-graph-viewer is not archived yet, so its "Select view" and "Views are addressable" requirements are not in main specs. This change supersedes them; reconcile when archiving (see design.md). -->

## Impact

- `viewer/`: new `selection-panel` and `selection` page modules, changes to `app.js`, `hash.js`, `views/browse.js` and the stylesheet; `views/select.js` is replaced.
- `viewer/select.js` gains a function for undecided decisions; `test/viewer.test.mjs` is updated for the new hash format.
- `README.md` hash format section.
- No change to `graph.json` or the build.
