# Proposal

## Why

Today the "design" is only a `pick=` list in the URL, and every click on a solution line edits it. So browsing and deciding are the same gesture, nothing can be recorded beyond a choice (no shortlist, no rejected option with a reason, no notes, no constraint values), and a design is lost as soon as the URL is. The user's design should be a persistent object of its own, edited only on purpose, while the graph stays free to explore.

## What Changes

- **New design document**: one active JSON document with an id, a name, an intent, prose values for constraint nodes, and per function a status (`open`, `exploring`, `decided`), a choice, a shortlist, rejected solutions with a reason, and notes. Saved in browser storage on every edit; exported and imported as a JSON file. Undo for every edit within the session.
- **BREAKING** Navigation never edits. Clicking in the graph only opens a node. Only explicit buttons in the node panel edit the design: Choose, Shortlist, Reject (with reason), Note, Undo. The URL hash holds view state only (open node, collapsed lines, peeked solutions); `pick=` is gone and old `pick=` links are ignored with a notice.
- **BREAKING** Graph panel redrawn: one line per function, its solutions as chips on that line, styled by their state in the design (chosen, open, shortlisted, rejected, excluded, required). Below a function only the chosen solution's sub-functions are listed; other solutions' subtrees are dormant and hidden, unless peeked. Lines can be collapsed and expanded. Constraint nodes stay listed after the tree. The link lane is removed: `requires` and `excludes` show as chip states, with the reasons in the node panel.
- **BREAKING** Node panel: the right panel, full height, replaces both the node modal and the selection view. It shows a breadcrumb (why-path), what the node is, its context (why, alternatives), its implications (brings, requires, excludes), its status in the design, a what-if preview for nodes not in the design, then the edit buttons. With no node open it shows the design overview (name, intent, counts, problems, brief, export/import, new design).
- Briefs attach to the design: the prompt is built from the design document (choices, shortlists, rejections with reasons, notes, constraint values, intent), the cache is keyed by the design id, and a brief is stale when the design or its chosen nodes changed. The save command takes an exported design file.

Out of scope: a local backend to save designs to disk (later change `local-backend`), research requests where an LLM grows the graph, a BOM view, several designs (load / save as), any solver beyond direct `requires` / `excludes`.

## Capabilities

### New Capabilities
- `design-document`: the persistent user design: its JSON shape, storage, edit actions and their rules, undo, export and import, and what is "in the design" (active functions, problems).

### Modified Capabilities
- `design-page`: page shell becomes graph panel + full-height node panel; routes hold view state only; click-to-choose and the node modal are replaced by the node panel and its edit buttons; the selection header becomes the design overview.
- `graph-viewer`: outline becomes function lines with solution chips, hides dormant subtrees, adds peek and collapse; state tags become chip states; link lane removed; hash holds view state.
- `selection-workspace`: removed; its consequences (undecided, missing requirements, conflicts) move to the design overview in `design-page` and to `design-document`.
- `selection-brief`: prompt, key and staleness are based on the design document instead of a set of ids; save command takes a design file.

## Impact

- Viewer: `viewer/app.js`, `viewer/hash.js`, `viewer/select.js` (replaced by a design module), `viewer/outline.js`, `viewer/brief.js`, `viewer/views/graph.js`, `viewer/views/main.js` and `viewer/views/node.js` (merged into a node panel and an overview), `viewer/index.html`, `viewer/style.css`.
- `scripts/brief.mjs`, `prompts/brief.md` (new prompt version), `briefs/index.json` format unchanged (key → file).
- Tests: `test/viewer.test.mjs`, `test/brief.test.mjs`.
- README screenshots become outdated.
- No change to the graph format, the build or `tools/graph.py`.
