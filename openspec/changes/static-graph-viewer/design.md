# Design

## Context

`graph.json` is `{ "nodes": [...] }`; each node has `id`, `title`, `type`, `parent`, `children`, optional `requires`, `excludes` (already symmetric), `compatible_with`, `confidence`, `sources` and a Markdown `body`. The goal of this change is a learning prototype: find out which views are useful and where the format hurts. See proposal.md.

## Goals / Non-Goals

**Goals:**
- A first end-to-end path: node files, `graph.json`, then a page a person can use.
- Code organized so that new views are cheap to add or generate later.

**Non-Goals:**
- Backend, editing, saving, runtime LLM, JSON view specs, AI-generated views.
- A solver. Transitive reasoning is left out on purpose.

## Decisions

**Views are functions of `(graph, params)`.** Each view is a module exporting `render(graph, params) -> HTMLElement`, with no hidden state. Interactions do not mutate the DOM directly: they change params, which are written to the URL hash, and the app re-renders from the hash. This keeps views reproducible and testable, and a later saved or generated view only needs to produce a `(view, params)` pair or a new `render`.
*Alternative:* component state in the DOM or a framework store. Rejected: it hides state that we want in the URL and makes later view generation harder.

**Hash format.** `#/browse/<node-id>` and `#/select?pick=<id>,<id>`. Node ids already contain `/`, so ids go after the view name and the rest of the hash is the id. Unknown ids are dropped with a notice.

**Plain HTML and ES modules, no framework, no build step.** `viewer/index.html` plus modules in `viewer/`. Matches the "static web app" constraint and keeps the loop fast. *Alternative:* Vite and a framework. Rejected for a solo prototype.

**Markdown rendering.** The node bodies use paragraphs, bold, inline code and lists. A small built-in renderer that escapes HTML first and then handles those, so bodies cannot inject markup and there is no dependency. *Alternative:* `marked` plus a sanitizer. Revisit if bodies need tables or links.

**Select semantics.** The selection is a set of node ids with at most one option per decision (choosing a sibling replaces the previous choice). The page derives, from direct edges only: `excluded` (any node listed in the `excludes` of a selected node, with the responsible selected node), `missing` (ids in the `requires` of a selected node that are not selected), and `conflicts` (pairs of selected nodes where one excludes the other). Because `excludes` is symmetric in the output, one pass over the selected nodes is enough. `requires` is not followed transitively.
*Assumption:* one option per decision matches the "alternatives" meaning of options. Components, if used later, may need multi-select.

**Serving.** `scripts/serve.mjs` is a small `node:http` static server over the repository root (so `/viewer/` and `/graph.json` are both reachable), run with `npm run serve`. No new dependency. The viewer fetches `../graph.json`.

**Layout.** One column on narrow screens, tree and detail side by side on wide ones, using CSS only.

## Risks / Trade-offs

- [One-level, AND-only reasoning looks naive] → Intended. The point is to see which missing semantics hurt in use, and record them as findings.
- [Hand-written Markdown renderer misses syntax] → Bodies are written by us in a known subset; unknown syntax is shown as plain text.
- [Prototype views become hard to replace] → Keep the `render(graph, params)` contract and avoid shared mutable state.

## Findings

From using Browse and Select on the 20-node demo graph:

- **`requires` is AND-only.** `gantry/corexy` requires `drive/gt2-belt`, but a real need is often "one of these". Select cannot express alternatives, and shows a single missing node.
- **`compatible_with` is not used by Select.** It is informational, so the controller choices never react to the gantry choice. Positive compatibility is invisible in the consequences panel.
- **Excluded options stay clickable-by-hash.** The page disables them, but a hand-written `pick=` hash can still contain both; the conflict list covers this case.
- **One option per decision is a clean fit for options.** Multi-select will be needed once `component` nodes (e.g. a list of parts) are used.
- **No notion of "decided but unsure".** `confidence` is shown in Browse but not carried into Select, so a selection built on `low` nodes looks as solid as any other.
- **Root and decisions have no useful body.** Browse on `root` shows an empty detail pane; decisions could carry the "how to choose" prose.
- **Selecting from Browse is missing.** There is no link from a node's detail pane to "select this option", so the two views are only connected by hand-edited hashes.
