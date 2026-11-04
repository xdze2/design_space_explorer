## Why

The two tabs (Design, Graph) split one task in two: the graph is where options are picked, the Design page is where the result is read. Switching loses context, and the Graph page needs a whole screen for an outline of 20 nodes. One page with both side by side removes the switching.

## What Changes

- **BREAKING (UI)**: one page, full width, no tabs. The Graph page is removed. Old `#/design`, `#/graph` and `#/browse/<id>` links still open the page.
- Left panel (about 40%): the graph as an indented outline, one line per node, indentation encodes depth. To the right of the names, aligned lanes: state tags (chosen, excluded by X, undecided, needs, conflict), an SVG lane where `requires`, `excludes` and `compatible_with` curves connect rows (lit for the open or hovered node), and a `(?)` button.
- Clicking an option's line toggles its selection. A `(?)` icon on every line opens the node view. Decisions and the root have no selection toggle.
- Right panel: the main view for the selection (brief, conflicts, missing requirements, chosen options, undecided).
- Node view is a modal over the page (Esc, backdrop or × closes).
- Top bar: compact selection summary, decision pills grouped by slot (chosen option or `?`), counts, Reset. Replaces the tray and the Mermaid block diagram.
- Removed: Mermaid diagram, outline depth cut (`up`/`down`), link badges, side drawer, the `layout` URL parameter (old `layout=` links are ignored).

## Capabilities

### Modified Capabilities
- `design-page`: single page shell, top bar, click-to-toggle, modal, main view; diagram removed.
- `graph-viewer`: Graph page becomes the left panel, an aligned outline; depth cut and badges removed; URL drops page and depths.
- `selection-workspace`: the Design page becomes the main view; page no longer in the URL.

## Impact

- `viewer/`: new `views/topbar.js`, `views/graph.js` and `views/main.js` rewritten or renamed; `outline.js` returns in a simpler form; `diagram.js` and `tree.js` removed; `hash.js`, `app.js`, `index.html`, `style.css` changed.
- No change to `graph.json`, the scripts or the briefs.

Out of scope: editing nodes in the UI (see `edit-mode`), drag and resize of the panels, new node data.
