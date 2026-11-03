# Design

## Context

The current viewer routes on `#/browse/<id>` and `#/select?pick=...`; each view is `render(graph, params) -> HTMLElement` and re-renders from the hash (see the static-graph-viewer design). Selection logic (`toggle`, `analyze`) already exists in `viewer/select.js` and is tested. This change reuses all of it and changes only layout, routing and one new page. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Selection and page are independent pieces of state in the URL.
- The panel and pages stay plain `render(graph, params)` functions.

**Non-Goals:**
- Any change to selection semantics, beyond listing undecided decisions.
- Backward compatibility for old `#/select` links (prototype).

## Decisions

**Hash format: page path plus a shared query.** `#/browse/<id>?pick=a,b`, `#/selection?pick=a,b`. `pick` is always the selection, whatever the page. `parseHash` returns `{ page, params: { id }, pick, unknown }`; `buildHash(page, params, pick)` builds it. Ids contain `/`, so the page name is the first segment and the id the rest of the path, as before. Default hash is `#/selection`.
*Alternative:* store the selection in `localStorage`. Rejected: shareable URLs and the reload scenario are cheap with the hash, and state stays visible.

**Layout owned by `app.js`.** `app.js` renders a shell with two regions: `panel` (always `selection-panel.render(graph, { pick })`) and `main` (the page for the hash). A page receives `(graph, params, pick)` so that links it creates (tree links, select actions) keep `pick`. Links are built only through `buildHash`, never by string concatenation, so the selection cannot be dropped by accident.
*Alternative:* each page renders its own panel. Rejected: duplicated code and focus or scroll lost on each page change.

**Panel is the old Select options list.** Same grouping, disabled excluded options, `toggle` on click. The "missing" and "conflicts" lists move out of the panel to the Selection page, so the panel stays short, like a filter menu. A small badge in the panel title shows the number of problems (missing plus conflicts), linking to the Selection page.

**Selection page content.** Order: conflicts, missing (with select action), selected options (title, rendered body, sources, link to Browse), undecided decisions (each linking to its Browse node). Conflicts and missing first because they need action. `analyze` is unchanged; add `undecided(graph, selection)` to `viewer/select.js`: decision nodes whose children contain no selected id.

**Browse button.** Shown only for `type === 'option'`, a link to `buildHash('browse', { id }, toggle(...))`, so it is a plain hash change and needs no handler. It stays on the same node.

**Narrow screens.** CSS grid with the panel first in one column, two columns (about 18rem panel) from 48rem. Browse's own tree and detail columns nest inside the main region, and collapse to one column when the main region is narrow (use a container-width-friendly breakpoint, so the three columns on a wide screen do not squeeze the detail).

**Reconciling specs.** static-graph-viewer is not archived, so main specs have no `graph-viewer` yet. Archive static-graph-viewer first, then at archive time of this change update its "Select view" and "Views are addressable" requirements to match `selection-workspace` (or remove them). Recorded here so it is not forgotten.

## Risks / Trade-offs

- [Three columns on a wide screen is cramped for Browse] → Panel is narrow and Browse's tree can collapse; revisit after use.
- [Selection survives navigation only if every link goes through `buildHash`] → Test `buildHash` with `pick`, and check in the browser by navigating after selecting.
- [Long hashes with many ids] → Fine for 20 nodes; ids are short.
