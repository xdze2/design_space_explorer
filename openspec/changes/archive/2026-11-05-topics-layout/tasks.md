# Tasks

## 1. Move files

- [x] 1.1 `git mv` `graph/` to `topics/pen_plotter/knowledge_graph/`, `graph.json` to `topics/pen_plotter/graph.json`, `briefs/` to `topics/pen_plotter/briefs/`; move `raw/` by hand to `topics/pen_plotter/raw/`; add `topics/pen_plotter/designs/.gitkeep`. Verify: `git status` shows renames only, `raw/` is still ignored.
- [x] 1.2 Replace `raw/` with `topics/*/raw/` in `.gitignore`. Verify: `git check-ignore topics/pen_plotter/raw/x.md` matches.

## 2. Tools and scripts

- [x] 2.1 `scripts/build-graph.mjs`: CLI takes an optional topic (validated name, default `pen_plotter`), reads `topics/<t>/knowledge_graph`, writes `topics/<t>/graph.json`; fix the "must sit directly under" message to `knowledge_graph/`. Verify: `npm run build` output is byte-identical to the old `graph.json`; `npm run build -- ../x` fails with a topic-name error.
- [x] 2.2 `tools/graph.py`: add `--topic` (default `pen_plotter`, validated) that sets the graph dir; keep `--graph-dir`; update the docstring paths. Verify: `python3 tools/graph.py lint` and `tree` work with no flags; `python3 -m unittest discover tools` passes.
- [x] 2.3 `scripts/brief.mjs`: add `--topic`; read `topics/<t>/graph.json`, write `topics/<t>/briefs/`; keep the template at `prompts/brief.md`; refuse a design file whose `topic` differs. Verify: `test/brief.test.mjs` updated and passing.
- [x] 2.4 `scripts/serve.mjs`: forbid `topics/*/raw/` instead of `raw/`. Verify: a request for `/topics/pen_plotter/raw/<file>` returns 403, `/topics/pen_plotter/graph.json` returns 200.

## 3. Design document

- [x] 3.1 `viewer/design.js`: optional `topic` field kept by `clean`; `emptyDesign` takes the topic; export includes it. Verify: unit tests for a design with and without `topic`.
- [x] 3.2 `viewer/store.js`: storage key `dse.design.<topic>` with the one-time fallback to `dse.design` for `pen_plotter`; import refuses a file naming another topic, design unchanged. Verify: store tests for key, fallback, and refused import.

## 4. Viewer

- [x] 4.1 `viewer/app.js`, `viewer/card.js`, `viewer/views/overview.js`: read `?topic=` (default `pen_plotter`, invalid name falls back to an error message) and fetch the graph, pictures and briefs from `../topics/<topic>/`. Verify: serve, open `/viewer/`, the graph, pictures and a cached brief load; `?topic=nope` shows an error naming `graph.json`.

## 5. Tests and docs

- [x] 5.1 Update paths in `test/*.test.mjs` and `tools/test_graph.py`. Verify: `npm test` and `python3 -m unittest discover tools` pass.
- [x] 5.2 Update `README.md` (layout, build, viewer URL, briefs, tool examples, the `topic` field). Verify: `grep -rnE "(^|[ \`(/])graph/|\.\./graph|briefs/|[ \`]raw/" README.md tools scripts viewer test package.json` finds no old root path.
