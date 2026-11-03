# Proposal

## Why

Researching a DIY pen plotter produces a lot of scattered information (web pages, videos, prices, what worked and why). The project is an LLM-maintained wiki of design decisions that structures this research as a graph and can later be browsed with a building assistant. Before building any UI or agent skills, the node format has to be proven on real content. This change defines the format and builds a small demo graph, so later changes (viewer, agent skills) rest on a tested schema.

## What Changes

- Define the node format: one Markdown file per node, with YAML frontmatter (`type`, `parent`, `requires`, `excludes`, `compatible_with`, `sources`, `confidence`) and a free prose body (why, tradeoffs, notes).
- Add a build script that reads the node folder, validates it, and compiles it into a single `graph.json`.
- Author a demo knowledge graph of about 15 to 25 pen plotter nodes: a `root`, decisions (gantry geometry, linear guide, drive type, pen lift, controller) and their options.
- Set up the repo layout, with the raw data folder git-ignored.

Out of scope:
- Any viewer or UI, including the building assistant.
- Agent skills for ingesting raw data.
- LLM editor or query backend.
- A constraint solver (constraints stay loose: edges plus prose).
- Topics other than the pen plotter.

## Capabilities

### New Capabilities
- `knowledge-graph-format`: the Markdown + frontmatter node format, its validation rules (required fields, reference integrity, sources required), and compilation to `graph.json`.
- `pen-plotter-demo-graph`: the demo content, meaning the root, decision nodes and option nodes covering the main pen plotter design choices, each with sources.

### Modified Capabilities
<!-- None: greenfield project. -->

## Impact

- New top-level folders for the node files (`graph/`), the build script (`scripts/`) and the git-ignored `raw/`.
- Output artifact: `graph.json`, to be consumed by the future viewer.
- No existing code or specs are affected. Node 22 is available, and the script should avoid heavy dependencies.
