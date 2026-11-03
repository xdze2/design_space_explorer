# Design space explorer

An LLM-maintained wiki of design decisions, stored as a graph of Markdown nodes. First topic: a DIY A3 pen plotter.

## Layout

- `graph/`: one Markdown file per node
- `scripts/build-graph.mjs`: validates the nodes and compiles them to `graph.json`
- `graph.json`: compiled output (committed)
- `raw/`: source material (web pages, chats, notes). Git-ignored and never read by the build.

## Node format

A node is a Markdown file under `graph/` with YAML frontmatter and a free prose body. Its id is its path relative to `graph/`, without `.md` (`graph/gantry/corexy.md` is `gantry/corexy`).

```markdown
---
title: CoreXY
type: option
parent: gantry
requires: [drive/gt2-belt]
excludes: [gantry/single-rail-cantilever]
compatible_with: [controller/fluidnc]
sources: ["LLM:sonnet-5.5"]
confidence: low
---
Why it would be chosen, the tradeoffs, and why each edge above exists.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | |
| `type` | yes | `root`, `decision`, `option` or `component` |
| `sources` | yes | non-empty list of free text: a URL, `user`, or `LLM:<model>` |
| `parent` | yes, except for `root` | exactly one `root` node; every node must reach it |
| `requires` | no | nodes that must also be selected |
| `excludes` | no | nodes that cannot be selected together; symmetric in the output |
| `compatible_with` | no | informational only |
| `confidence` | no | `low`, `medium` or `high`; use `low` for unchecked LLM content |

Every id in `parent`, `requires`, `excludes` and `compatible_with` must exist.

## Build

```sh
npm install
npm run build   # graph/ -> graph.json
npm test
```

The build prints every error and writes nothing if validation fails.
