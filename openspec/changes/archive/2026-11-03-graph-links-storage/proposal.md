# Proposal

## Why

The graph is a strict tree: each node has one `parent`, and the node's id is its file path, so the hierarchy is baked into the folder layout. Real design topics need a node under more than one abstraction chain (for example a belt drive under both "Linear motion" and "Low-cost build"), and links need their own provenance so an AI assistant can maintain them and a person can review what it changed in `git diff`.

## What Changes

- Nodes get a stable **short id**: 8 lowercase hex characters, stored as `id` in the frontmatter. The file path no longer defines the id or the hierarchy; the folder is only for browsing the files.
- All links move out of the node files into one **`graph/links.jsonl`**: one edge per line, sorted, with provenance (`src`) and a tool-generated readable `hint`. Edge types: `parent` (child to parent, may appear several times per node), `requires`, `excludes`, `compatible_with`.
- The hierarchy is a **DAG**: a node may have several parents. The build rejects cycles and unreachable nodes. `graph.json` keeps `parent` (the first parent, so the viewer keeps working) and adds `parents`.
- A small **Python tool** (`tools/graph.py`, standard library only) is the one way to edit the data: create a node, add or remove a link, list a tree, normalize the links file, and lint for graph hygiene (including redundant transitive parent links).
- **Migrate the demo graph** to the new format, and update the README.

Out of scope:
- The new outline view with depth cut (a separate change, `outline-view`); the viewer keeps working with `parent` only.
- Selection logic for nodes with several parents, `children_mode` (all, one, none), tags.
- Any AI-driven link maintenance, and editing links from the viewer or edit mode.
- Briefs written for the old ids (they become stale; see design).

## Capabilities

### New Capabilities
- `graph-tool`: the Python command-line tool that creates nodes, edits links, prints trees and lints the graph, writing the links file in its canonical form.

### Modified Capabilities
- `knowledge-graph-format`: node ids come from the frontmatter, links live in `links.jsonl`, the hierarchy is a DAG with possibly several parents, and the compiled output gains `parents`.
- `pen-plotter-demo-graph`: the demo is expressed in the new format (same content, same coverage rules).

## Impact

- `scripts/build-graph.mjs`: read `links.jsonl`, new validation, derive `parent`, `parents`, `children`; `test/build-graph.test.mjs` is rewritten for the new layout.
- `graph/**/*.md`: frontmatter loses `parent`, `requires`, `excludes`, `compatible_with` and gains `id`; new `graph/links.jsonl`; `graph.json` is regenerated with new ids.
- New `tools/graph.py` and `tools/test_graph.py`; Python 3 is needed to edit the graph, not to build or view it.
- Viewer URLs and the existing brief use ids, so their ids change; the one existing brief becomes stale.
- `README.md`: node format, links file and tool sections.
