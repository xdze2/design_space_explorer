# Proposal

## Why

The demo graph (20 pen plotter nodes in `graph.json`) is only readable as raw files. To find the right tool, workflow and data structure, the graph has to be browsed and used, so that gaps in the format show up as friction and not as guesses. A first end-to-end prototype, from node files to a web page, is the fastest way to learn what the next changes (ingest workflow, richer views, assistant) actually need.

## What Changes

- Add a static web page (plain HTML and JS, no framework, no build chain) that loads `graph.json` and shows it.
- Add two views:
  - **Browse**: the hierarchy as a tree, with a detail pane for the selected node (rendered Markdown body, sources, confidence, edges as links to other nodes).
  - **Select**: the user picks options and the page shows the consequences: options excluded by the current selection, and required nodes not yet selected.
- Structure the code so that a view is a plain function of `(graph, params)` that returns a page fragment, and so the current view and its params are encoded in the URL hash. This is a design principle, not a feature: it leaves room for saved or generated views later.
- Add a way to serve the page locally.

Out of scope:
- Any backend, saving, or in-page editing of nodes or views.
- Runtime LLM calls, view specs in JSON, and AI-generated views.
- A constraint solver: the Select view only reads the existing `requires` and `excludes` edges one level deep.
- Changes to the node format or build script (schema gaps found go into `design.md` findings).
- Visual polish beyond a readable layout that works on a phone-width screen.

## Capabilities

### New Capabilities
- `graph-viewer`: a static page that loads the compiled `graph.json` and offers the Browse and Select views, with the view and its params addressable by URL.

### Modified Capabilities
<!-- None. -->

## Impact

- New folder `viewer/` with `index.html` and JS modules, plus a small local serve script.
- Reads `graph.json` as produced by `npm run build`. No change to the graph format.
- One small client-side Markdown rendering dependency, or a minimal built-in renderer. This is decided in `design.md`.
