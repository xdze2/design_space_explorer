# Design

## Context

The viewer is plain ES modules with no build step (`viewer/*.js`), rendered by rebuilding both panels on every `hashchange` in `viewer/app.js`. All state lives in the hash (`pick`, `view`), so the whole app is a pure function of `location.hash` plus `graph.json`. `viewer/select.js` holds the selection logic (`toggle`, `analyze`, `undecided`) and is unit-tested with `node --test` against the demo graph. The graph panel (`views/graph.js`) draws fixed-height rows and an SVG link lane; the node view is a modal (`views/node.js`); the right panel is the selection summary (`views/main.js`). Briefs are keyed by `selectionKey(pick)`.

This change adds a second source of state, the design document, which must not live in the hash. See proposal.md for the why; the specs define behavior.

## Goals / Non-Goals

**Goals:**
- Keep the viewer a pure render of (graph, design, view state), so it stays easy to reason about and test.
- Keep all design rules (status transitions, active set, chip state, problems, what-if) in DOM-free modules testable with `node --test`.
- Keep the document format simple and stable enough that the later `local-backend` change can save the same JSON to disk.

**Non-Goals:**
- No framework, no bundler, no new dependency.
- No multi-design management, no sync between tabs beyond reading storage on load.
- No transitive constraint propagation; direct `requires` / `excludes` only, as today.

## Decisions

### State: design in a store module, view state in the hash
`viewer/design.js` (pure) defines the document shape, `emptyDesign()`, `clean(graph, raw) → { design, dropped }`, and the actions as pure functions `(graph, design, args) → design`. `viewer/store.js` holds the current design and an in-memory undo stack (array of previous documents), applies an action, saves to `localStorage` (key `dse.design`, wrapped in try/catch), and calls a `render()` callback. `app.js` re-renders on `hashchange` and on store change.

Alternative: keep the design in the hash (compressed). Rejected: the user wants navigation and editing separated, notes and reasons make it long, and a shared URL would silently overwrite the receiver's work.

### Actions are pure and whole-document
Each action returns a new document (structured clone of the entry it touches); undo pushes the previous document. Documents are small (tens of functions), so snapshotting is simpler than inverse operations and makes New design and Import undoable for free. The undo stack is capped (e.g. 100) and not persisted.

### Status is stored but always derived by actions
The spec lists `status` as a field. Actions set it by the rules in `design-document` (Choose → decided, etc.), and `clean()` recomputes it from choice/shortlist on load so a hand-edited file cannot hold an inconsistent status. Rationale: the field is useful to readers of the exported JSON and to the LLM prompt, without becoming a second source of truth.

### Active set, chip state and problems in one analysis pass
`analyzeDesign(graph, design)` walks from the root: a function's function-children are active; for a function with solution children, the choice's how-targets are active. It returns `active` (Set of function ids), `chosen` (active choices), `excluded` (id → chosen cause), `required` (id → chosen causes), `conflicts`, `missing`, `undecided`. `chipState(analysis, design, fnId, solId)` applies the priority order from the spec. This replaces `select.js` (`decisions()` moves to `design.js`).

`whatIf(graph, design, solId)` runs `analyzeDesign` on the design with the solution chosen and diffs the two analyses (replaced choice, activated / deactivated functions, added missing, new conflicts). Reusing the analysis avoids a second rule set.

### Solutions with several whys
A solution is chosen under a specific function (the entry key), so a solution reachable from two functions is handled per function. In the demo graph each solution has one why; chips and actions always carry the function id from the line they come from, and the node panel uses the breadcrumb's function.

### Graph panel: visible tree built from analysis + view state
`outline.js` gets `visibleRows(graph, design, analysis, { fold, peek, view })` returning rows `{ id, depth, kind: 'function'|'component'|'constraint', dormant, repeat, hidden }` where a function row carries its solution ids. Rule: under a function with solutions, list the how-targets of the choice, else of the peeked solution (dormant). To keep the open node visible, compute its breadcrumb path first and treat the solutions on that path as transiently peeked. Folded rows skip their subtree and report the hidden count. The old `outlineRows` / `crossLinks` and the SVG lane are deleted.

Rows no longer need a fixed height (no lane arithmetic); chips wrap on narrow screens.

### Hash: `view`, `fold`, `peek`
`#/?view=<id>&fold=<id>,<id>&peek=<id>,<id>`. Peek is keyed by solution id (one per function enforced when toggling). Collapse and peek toggles are plain links to a new hash, like today's links; the Esc / close button go to the hash without `view`. `pick` is parsed only to raise the notice.

### Node panel replaces modal and main view
`views/node.js` becomes the panel (breadcrumb, sections, status, what-if, buttons); `views/overview.js` (from `views/main.js`) renders the no-node state. Edit buttons are `<button>`s calling store actions (not links), so they never touch history. The Reject reason and the notes / constraint / name / intent fields are inline inputs, saved on confirm (Reject) or on change (text fields, debounced on input to avoid one undo step per keystroke: one undo step per field edit session, committed on blur/change).

The node panel resets scroll to the top when `view` changes and keeps it otherwise; the graph panel keeps it always (existing `fill()` helper).

### Export / import
Export: `Blob` + `<a download>` with file name `<slug of name>.design.json`, pretty-printed. Import: hidden `<input type=file>`, `JSON.parse`, then `clean()`; errors and dropped ids go into the panel's notice area. Document shape (`format: 1`):

```json
{ "format": 1, "id": "d-3f9a1c2e", "name": "My plotter", "intent": "…",
  "constraints": { "2cc55003": "A4, sometimes A3" },
  "functions": { "854ac5e5": { "status": "decided", "choice": "1f4df7b0",
    "shortlist": ["2e099434"], "rejected": [{ "id": "a316aecc", "reason": "…" }], "notes": "" } } }
```

### Briefs keyed by design id
`brief.js`: `designKey(design) = design.id`; `contentHash(graph, design)` hashes the cleaned document minus `id` together with the content of the chosen nodes (title, body, sources, requires, excludes) — the same fields as today. `buildPrompt(template, graph, design)` fills new placeholders (`{{design}}` for name / intent / constraint values, `{{selected}}`, `{{explored}}` for shortlists, rejections and notes, `{{problems}}`, `{{undecided}}`); `prompts/brief.md` goes to version 3. `scripts/brief.mjs save <design.json> <brief.md> [--model]` cleans the file against `graph.json`, fails on unknown ids (instead of dropping them), and writes `briefs/<id>.md` with frontmatter `design_id`, `design_name`, `content_hash`, `model`, `prompt_version`, `created`.

## Risks / Trade-offs

- [Design only in one browser] → Export/import now, `local-backend` next; the overview says where the design is kept.
- [Graph edits make stored ids stale] → `clean()` on every load drops unknown ids with a notice; entries for known but inactive functions are kept.
- [Choosing an excluded solution is allowed] → It shows as a conflict in chips, overview and prompt rather than being blocked; matches the "loose constraints, no solver" principle and avoids dead ends when the graph's exclusions are wrong.
- [Re-render on every keystroke would lose input focus] → Text fields commit on change/blur, not on input; the store re-renders after commit.
- [Losing the link lane removes an at-a-glance view of cross links] → Chip states show the ones that matter for the current design; the node panel lists all of them.
- [Old `pick=` links and README screenshots break] → Notice on `pick`; screenshots refreshed in the last task.

## Migration Plan

Single static deploy, no data to migrate: `briefs/index.json` is empty in the repo, and old `pick=` URLs only produce a notice. Rollback is a git revert.

## Open Questions

- Default design name: "Untitled design" is assumed; can change without affecting anything else.
