# Design

## Context

Everything assumes one graph at the repo root. Paths are hardcoded in `tools/graph.py` (`DEFAULT_GRAPH_DIR`), `scripts/build-graph.mjs` (`graph`, `graph.json` defaults), `scripts/brief.mjs` (`graph.json`, `briefs/`), `scripts/serve.mjs` (blocks `raw/`), the viewer (`../graph.json`, `../graph/img/`, `../briefs/`) and tests. `buildGraph(graphDir, outFile)` and `saveBrief({root, ...})` already take their locations as arguments, so the pure functions need no change. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One folder per topic holding everything about it; committed content apart from `raw/`.
- Every entry point (tool, build, brief, viewer, server) takes a topic with a default, so existing habits keep working.
- A design knows its topic.

**Non-Goals:**
- A topic switcher in the UI, a topic index file, design library features.
- Moving `prompts/brief.md` (shared by all topics).

## Decisions

- **Layout**: `topics/<topic>/{knowledge_graph,designs,briefs,raw}` plus `graph.json` next to them. `topics/` rather than `user_data/` because the content is curated and committed. `graph.json` stays a sibling of `knowledge_graph/` (not inside it) so the source folder holds only sources. Alternative: keep `graph.json` at the root per topic name; rejected, it scatters topic files.
- **Topic name**: lowercase letters, digits, `_` and `-`, starting with a letter or digit. Checked in every entry point so a name can never be a path.
- **Default topic**: `pen_plotter` in each entry point (Python, Node, viewer) as one constant each. Alternative: a root config file naming the default; rejected, three one-line constants are lighter for a solo project.
- **CLI**: `tools/graph.py --topic <t>` (default `pen_plotter`; `--graph-dir` stays as an override, used by tests). `npm run build -- [topic]` replaces the `graphDir outFile` positionals. `npm run brief -- save <design> <brief> [--topic t] [--model m]`. The exported functions keep their signatures; only the CLI mains change.
- **Viewer**: topic from the query string `?topic=<name>`, default `pen_plotter`. The URL hash keeps holding the view only. The graph, pictures, briefs and designs are fetched from `../topics/<topic>/`. An unknown topic shows the usual load error naming the file.
- **Server**: serves the repo root as now; the `raw` block becomes any path of the form `topics/*/raw/`.
- **Design `topic` field**: optional string, `format` stays `1` (older files without it still load and are treated as belonging to the current topic). A new design and every export carry the topic. Import of a file naming another topic is refused with a message, design unchanged. Brief save applies the same check. Alternative: bump `format`; rejected, the field is additive.
- **Storage key**: `dse.design.<topic>`. For `pen_plotter`, if the new key is empty the old `dse.design` is read once and written under the new key. Other topics never read the old key.
- **Git**: `git mv` for tracked files so history follows; `raw/` is moved with plain `mv` (git-ignored). `.gitignore` gets `topics/*/raw/` instead of `raw/`. `topics/pen_plotter/designs/.gitkeep` keeps the folder.

## Risks / Trade-offs

- Old bookmarks and scripts using root paths break → documented as breaking in the README; it is a solo project.
- A missed hardcoded path surfaces only at runtime → grep for the old paths at the end, run all tests, and load the viewer once in a browser.
- The legacy storage fallback is dead code once read everywhere → one small function, removable later.

## Migration Plan

Move files in one commit with the code changes so every commit builds. Run `npm run build`, confirm `topics/pen_plotter/graph.json` is byte-identical to the old `graph.json`. Rollback is `git revert` (plus moving `raw/` back by hand).
