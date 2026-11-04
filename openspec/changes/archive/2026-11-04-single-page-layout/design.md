## Context

The viewer is static ES modules re-rendered on every `hashchange`. The hash holds the selection (`pick`) and the open node (`view`). Panels are persistent DOM elements so scroll positions survive a re-render.

## Decisions

- **Shell**: `#topbar`, `#graph-panel`, `#main-panel` and a `#modal`, all in `index.html`. Grid `minmax(20rem, 2fr) 3fr`, stacked under 52rem. Each panel scrolls on its own.
- **Hash**: `#/?pick=a,b&view=id`. Legacy paths (`design`, `graph`, `selection`, `browse/<id>`) still parse; `browse/<id>` sets `view`. `up`, `down` and `layout` are ignored.
- **Aligned outline** (`outline.js`, `views/graph.js`): preorder walk from the root, one line per node, fixed row height, `padding-left` by depth. A node reached again through another parent is listed again, marked `repeat`, and its children are not repeated. No depth cut: the graph is small.
- **Lanes**: right of the names, at fixed x positions so they line up across rows: a tags lane (state tags: chosen, excluded by X, undecided, needs, conflict), an SVG lane for links, a `(?)` lane. Rows are one grid: `name | tags | link lane | ?`.
- **Link lane**: one SVG over the lane, as tall as the list. Each link joins the two rows' y positions (row index times row height) with a curve bending into the lane; its depth in the lane grows with the row distance. `requires` has an arrow, `excludes` is red dashed, `compatible_with` dotted; `excludes` and `compatible_with` are drawn once per pair. Faint by default, strong when they touch the open or hovered row. A small dot marks each row's end of a link. Fixed row height makes the geometry pure arithmetic, with no DOM measuring and no redraw on resize.
- **Row interaction**: main click on an option toggles it (one per decision, as `toggle` already does); excluded unchosen options do not toggle, a chosen one can always be removed. Main click on a decision or the root opens the node view. `(?)` opens the node view. The status dot is display only.
- **Top bar**: pills grouped by `slot` (`Other` last, only when used). Pill state: decided, open (dashed), needed, conflict. A pill opens its decision.
- **Modal**: replaces the drawer. Edge links inside it still `location.replace` so Back leaves in one step.
- **Mermaid** is dropped with the diagram: the pills carry the summary, and the page loses a CDN dependency.
- **Dropped after trying**: a columns layout (one column per depth, parents centered, SVG elbows) was built first and removed; the aligned outline gives a straighter scan down the page.

## Risks

- Many cross links crowd the link lane; lanes fade unless a row is open or hovered.
- Click-to-toggle makes a mis-click change the selection; Reset and the pills make it visible, and the modal's choose action stays.
