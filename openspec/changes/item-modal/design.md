# Design

## Context

Current viewer: `app.js` routes `#/selection` and `#/browse/<id>` through `parseHash`; `panel.js` is rendered on every page and its options are links that toggle; `browse.js` shows a tree plus a detail pane for one node. The detail pane (title, body, edges, sources, select button) is what moves into the modal. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Panel actions are unambiguous: toggle, view, reset.
- One node detail component, used from the panel, the Selection page and Browse.
- Modal state survives reload and works with the back button.

**Non-Goals:**
- Focus-trap perfection, animations, tree keyboard navigation.

## Decisions

**Hash grammar: `#/<page>[?pick=..&view=..]`.** `view` joins `pick` as a query parameter, so page, selection and modal are three independent parts. `parseHash` returns `{ page, pick, view, unknown }`; `buildHash(page, { pick, view })`. Browse no longer has a path id. A legacy `#/browse/<id>` is parsed as page `browse` with `view = id` (root id means no view). `params` is dropped.
*Alternative:* a separate `#/node/<id>` route. Rejected: it would replace the page behind the modal.

**Modal is a layer, not a page.** `app.js` renders page content as now, then, if `view` is set, appends `renderModal(graph, view, pick, route)` as a sibling layer. Every link the page builds is created with `buildHash(page, { pick, view })` and the page code passes the current `view` along so toggles keep the modal. Opening and closing set `location.hash` (a new history entry), so back closes the modal. A full re-render on each hash change is acceptable at this size; the scroll position of the page is restored after render.
*Alternative:* `<dialog>`. Rejected for v1: hash-driven rendering already owns visibility, and `<dialog>` needs imperative open/close that would fight it. The layer gets `role="dialog"`, `aria-modal="true"`, focus on the close button, and an Esc handler registered per render.

**Modal content reuses `detail()`.** The function moves from `browse.js` to `views/modal.js`; edge links point at `view=<other>` on the current page; the select button targets `toggle(...)` with the same `view`. Visible text of the button is unchanged.

**Panel.** Each option row becomes: toggle link (checkmark and title, as now) plus a small "i" view link. Excluded rows keep their reason and still get the view link. Header gets a Reset link: `buildHash(page, { view })` with an empty pick, so the page and the modal are kept. The `<header>` title becomes a link to `#/selection`. The panel is rendered only when the page is `selection`; `layout` on Browse has a single column.

**Browse overview.** `browse.js` renders the whole tree with all `details` open; each node is a link to `view=<id>` on the browse page; chosen options get a mark. The old detail pane and its selection button are removed (the button lives in the modal).

## Risks / Trade-offs

- [Every hash change re-renders the page] → Selection page briefs are fetched again; acceptable, the fetches are tiny and cached by the browser.
- [Back button walks through every modal open] → That is the wanted behaviour (back closes the modal); node-to-node links inside the modal use `location.replace` so they do not pile up history.
- [Old links `#/browse/<id>`] → Handled by the legacy parse rule.
- [`selection-page` not yet archived] → This change is written as a new capability and notes the requirements it supersedes; archive order matters.
