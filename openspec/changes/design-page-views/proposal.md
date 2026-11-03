# Proposal

## Why

The viewer mixes three different things: the graph (the whole space), the selection (the current design) and the page that presents the selection. The left selection panel is both a navigation list and the selection editor, and Browse opens nodes in a modal although node detail is its main action. Before adding data, images and AI-written pages, the views need clear roles, and the selection needs a visual summary of the design it describes.

## What Changes

- Split the viewer into **Graph** (browse the whole space), **Design** (the page derived from the selection, now the default) and **Node** (detail of one node).
- Replace the left selection panel with a compact **selection tray**: chips for the chosen options, counts of undecided decisions and problems, and Reset. Choosing options moves to the Graph page and to the decision node view, which lists its options with choose actions and exclusion reasons.
- The Design page starts with a **generated Mermaid block diagram**: decisions grouped by slot, each box showing the chosen option or an "undecided" placeholder, with requires, conflict and missing-requirement edges. The brief, conflicts, missing requirements and chosen options follow below.
- Node detail opens as a **side drawer** on the Design page and as the **main pane** on Graph (list beside it). The modal is removed.
- Add an optional **`slot`** field to nodes (a group label for decisions) to the node format and the build validation.
- Old URLs keep working: `#/selection` shows Design, `#/browse[/id]` shows Graph.

Out of scope: more nodes, images and per-node drawings, AI page-writing pipeline beyond the existing brief, a physical (drawn) schematic, edit mode changes.

## Capabilities

### New Capabilities
- `design-page`: the Graph / Design / Node views, the selection tray, the drawer and main-pane node detail, the generated block diagram, and URL routing for them.
- `node-slots`: the optional `slot` field on nodes, its validation and its use to group the diagram.

### Modified Capabilities
<!-- openspec/specs/ is still empty: `selection-workspace` (selection-page) and `item-modal` are unarchived deltas. This change supersedes their panel, modal and Browse requirements; archive those first, then sync this one over them. -->

## Impact

- `viewer/`: `app.js` (routes, layout), `hash.js` (pages `design` and `graph`, legacy aliases), new `diagram.js`, `views/tray.js`, `views/drawer.js`, `views/design.js` (from `selection.js`), `views/graph.js` (from `browse.js`); remove `views/panel.js` and `views/modal.js`; `style.css`.
- `scripts/build-graph.mjs`: validate and pass through `slot`. Add `slot` to the 5 decision files in `graph/`, then rebuild `graph.json`.
- Mermaid loaded lazily from a pinned CDN version; the page still works without it.
- Tests in `test/` for hash routing, diagram source and slot validation. `README.md` Viewer section.
- Builds on `edit-mode` being unapplied: its controls live on the Selection page, which becomes Design; rename there when applying.
