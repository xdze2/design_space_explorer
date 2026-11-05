# Proposal

## Why

The repo is built around one graph at its root (`graph/`, `graph.json`, `briefs/`, `raw/`). More material is coming: designs for about ten existing pen plotters, a library of designs, and possibly a second subject later. Each subject needs its own graph, designs, briefs and source material in one place, and committed content must be separate from collected data. Moving now, before the design library is built, means that change targets the final layout.

## What Changes

- New layout, one folder per topic; the first topic is `pen_plotter`:
  - `topics/<topic>/knowledge_graph/`: node files, `links.jsonl`, `img/` (was `graph/`)
  - `topics/<topic>/graph.json`: compiled output, committed (was `graph.json`)
  - `topics/<topic>/designs/`: reserved for design files (empty for now, used by the next change)
  - `topics/<topic>/briefs/`: cached briefs (was `briefs/`)
  - `topics/<topic>/raw/`: source material, git-ignored (was `raw/`)
- `tools/graph.py`, the build, the brief command and the viewer take a topic (default `pen_plotter`); the server serves `topics/` and keeps every `raw/` private.
- The design document gets an optional `topic` field; a new design records the current topic and an import for another topic is refused.
- The browser storage key becomes per topic; the old key is still read once for `pen_plotter`.
- README and tests follow the new paths.
- **BREAKING**: old paths (`graph/`, `graph.json`, `briefs/`, `raw/` at the root) and the old `build-graph` argument form no longer work.

Behavior is otherwise unchanged. Out of scope: the design library (list, switch, committed designs, comparison), a topic switcher UI, moving `prompts/` (the brief template stays shared), any new graph content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-graph-format`: paths of nodes, links file, compiled output and `raw/` move under `topics/<topic>/`.
- `graph-tool`: the tool works on a topic's knowledge graph.
- `graph-viewer`: the viewer loads the graph of a chosen topic; the serve command serves topics and hides `raw/`.
- `selection-brief`: briefs live under the topic.
- `design-document`: optional `topic` field, per-topic storage, import checks the topic.
- `pen-plotter-demo-graph`: the demo graph lives in the `pen_plotter` topic.

## Impact

- Moved: `graph/*`, `graph.json`, `briefs/*`, `raw/*` (git-ignored, moved by hand) into `topics/pen_plotter/`.
- Code: `tools/graph.py`, `scripts/build-graph.mjs`, `scripts/brief.mjs`, `scripts/serve.mjs`, `viewer/app.js`, `viewer/card.js`, `viewer/views/overview.js`, `viewer/store.js`, `viewer/design.js`, `package.json`, `.gitignore`.
- Tests: paths in `test/*.test.mjs` and `tools/test_graph.py`.
- Docs: `README.md`.
