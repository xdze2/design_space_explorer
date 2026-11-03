# Tasks

## 1. Build reads ids and links

- [x] 1.1 In `scripts/build-graph.mjs`: take the node id from the frontmatter (8 lowercase hex, unique), reject `parent`, `requires`, `excludes` and `compatible_with` in frontmatter, read `graph/links.jsonl` (missing file means no links), validate each line (JSON, fields, type, `src`, no duplicates, known ids, no self link) with line numbers in errors. Rewrite the fixtures in `test/build-graph.test.mjs` for the new layout and add cases for every scenario in the `knowledge-graph-format` delta (missing or duplicate id, link field in frontmatter, malformed line, unknown type, duplicate link, dangling reference, self link, hint ignored). Verify with `npm test -- test/build-graph.test.mjs` (or `node --test test/build-graph.test.mjs`)
- [x] 1.2 Compile the hierarchy as a DAG: cycle detection over all `parent` edges, every non-root node reaches the root, `parents` in link-file order, `parent` as the first parent, `children` sorted by title, nodes sorted by id, `excludes` symmetric as before. Add tests for two parents (node in both `children`, `parent` is the first), cycle, orphan, and deterministic output. Verify with the same test command

## 2. Python tool

- [x] 2.1 Create `tools/graph.py` (standard library only) with the shared helpers: read nodes (`id`, `title`) from frontmatter, read and write `links.jsonl` in canonical form (key order, sort, compact JSON, hint from titles), resolve ids and unique prefixes with clear errors, and the subcommands `link` and `unlink` (types `parent`, `requires`, `excludes`, `compatible_with`; `--src`; duplicate and cycle refusal). Add `tools/test_graph.py` (`unittest`, temporary directories) covering the `Link editing` scenarios, and one test that builds the result with `node scripts/build-graph.mjs`. Verify with `python3 -m unittest discover tools`
- [x] 2.2 Add `new` (title, type, `--parent` repeated, `--source` repeated, `--confidence`, `--slot`; flat slug file name with numeric suffix, unique id, root needs no parent), `tree` (outline with repeats marked) and `format`. Add tests for the `Node creation`, `Readable hints` and `Tree listing` scenarios. Verify with `python3 -m unittest discover tools`
- [x] 2.3 Add `lint` (redundant parent link, parentless node, `requires` with `excludes` on the same pair, stale hint; one line per finding, non-zero exit on findings, no writes). Add tests for the three `Lint` scenarios. Verify with `python3 -m unittest discover tools`

## 3. Migrate the demo and keep the viewer working

- [x] 3.1 Write a throwaway migration script (outside the repo tree, for example in the scratchpad) that assigns an id to each file in `graph/`, moves the four link fields into `graph/links.jsonl` with `src: "migration"`, and runs `tools/graph.py format`. First save the current `graph.json` for comparison. Run it, delete `briefs/02216aef876fcc.md` and its `briefs/index.json` entry, and rebuild. Verify with a one-off comparison of old and new `graph.json` by title (same nodes, bodies, slots, parents and `requires`/`excludes`/`compatible_with`), `python3 tools/graph.py lint` printing nothing, and `npm run build` exiting 0
- [ ] 3.2 Update `test/viewer.test.mjs` and `test/brief.test.mjs`: they use path ids (`gantry/corexy`, ...), so look nodes up by title in the built graph with a small helper. Confirm the viewer behaves as before: `npm test` passes, and `npm run serve` shows the Design and Graph pages with working selection (check the page by hand in a browser: select an option, see the diagram, open a decision)

## 4. Documentation

- [x] 4.1 Update `README.md`: node format (frontmatter `id`, no link fields), the links file format and canonical form, the Python tool with an example session (`new`, `link`, `tree`, `lint`, `format`), and the note that Python is only needed to edit the graph. Verify by running the README's example commands on a copy of the graph and getting the output shown
