# Design space explorer

An LLM-maintained wiki of design decisions, stored as a graph of Markdown nodes. First topic: a DIY pen plotter.

![Viewer with a design: the design tree on the left, the design overview on the right](docs/design-overview.png)

## Quick start

```sh
npm install
npm run build   # validate topics/pen_plotter/knowledge_graph -> graph.json
npm run serve   # http://localhost:8080/viewer/
npm test
```

## Layout

One folder per topic under `topics/` (the first is `pen_plotter`). Every command takes a topic, default `pen_plotter`.

- `topics/<topic>/knowledge_graph/`: one Markdown file per node, `links.jsonl` with all links, optional `img/` pictures
- `topics/<topic>/graph.json`: compiled output (committed)
- `topics/<topic>/designs/`: design files of products and users (`<slug>.design.json`)
- `topics/<topic>/briefs/`: cached briefs
- `topics/<topic>/raw/`: source material, git-ignored, never read by the build
- `tools/graph.py`: edits nodes and links
- `scripts/build-graph.mjs`: validates and compiles the graph
- `viewer/`: the static browsing page
- `prompts/brief.md`: brief prompt template
- `skills/`: project skills for Claude Code (e.g. `/ingest`)
- `inbox.md`: sources waiting to be ingested, one per line

## Docs

- [Graph format](docs/graph-format.md): node files, `links.jsonl`, `graph.json`, build
- [Editing the graph](docs/editing.md): `tools/graph.py`, lint, skills, the inbox
- [Viewer](docs/viewer.md): the UI, the design document, URL hash
- [Briefs](docs/briefs.md): getting an AI-written brief for a design
