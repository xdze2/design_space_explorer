# Tasks

## 1. Repo setup

- [x] 1.1 Add `.gitignore` containing `raw/` and `node_modules/`, create the `raw/` folder, and verify `git status` does not list a test file placed in `raw/`
- [x] 1.2 Add `package.json` (ESM, `yaml` dependency, `build` and `test` scripts) and verify `npm install` succeeds

## 2. Build script

- [x] 2.1 Implement `scripts/build-graph.mjs`: read `graph/**/*.md`, parse frontmatter, derive ids, and emit `graph.json` with `children`. Verify with a fixture test that a valid folder produces the expected JSON
- [x] 2.2 Add validation (required fields and enums, non-empty `sources`, single root, no orphans or parent cycles, no dangling references) that collects all errors and writes nothing on failure. Verify with fixture tests, one per failure scenario in the spec
- [x] 2.3 Normalize `excludes` to be symmetric in the output and verify with a fixture test
- [x] 2.4 Document the node format and the build command in `README.md`, with one example node, and verify the documented command runs as written

## 3. Demo graph

- [x] 3.1 Create the `root` node and the five decision nodes (gantry geometry, linear guide, drive type, pen lift, controller), then verify the build passes
- [x] 3.2 Add two to four options per decision (15 to 25 nodes in total), each with why and tradeoffs in the body and sources marked `LLM:<model>` with `confidence: low` unless a real source is cited. Verify the build passes and the node count is in range
- [x] 3.3 Add at least five cross-decision `requires` or `excludes` edges, each explained in the declaring node's body. Verify with `grep` or a quick script that the edge count is at least five and the build passes
- [x] 3.4 Run the build, commit-ready `graph.json` included, and review it for schema gaps, noting any in `design.md` under a new "Findings" heading

## 4. Integration check

- [x] 4.1 Run `npm test` and `npm run build` from a clean checkout state and verify both exit 0, and that `openspec validate demo-pen-plotter-graph` passes
