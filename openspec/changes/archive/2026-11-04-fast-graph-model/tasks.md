## 1. Build validation and `graph.json` shape

Note: build tests use temporary folders and stay green. From 1.1 until the new demo graph exists (group 3), `npm run build` on the real `graph/` is red; groups 1 to 4 are meant to land in one commit.

- [x] 1.1 `scripts/build-graph.mjs`: new types (`function`, `solution`, `component`, `constraint`); `root`, `decision`, `option` rejected naming node and type; `slot`, `parent`, `requires`, `excludes`, `compatible_with` rejected in frontmatter. Update `test/build-graph.test.mjs` (fixtures, old-type and slot tests). Verify with `npm test` (build tests pass)
- [x] 1.2 Flat storage: build fails on any `.md` in a subfolder of `graph/`, naming the file. Add a test. Verify with `npm test`
- [x] 1.3 Links file: accept `how` and `constrains`, reject `parent` with the line number. Verify with a test for each (`npm test`)
- [x] 1.4 Type pairs: `how` only function>function, function>solution, solution>function, solution>component; `constrains` only constraint>function; `requires`/`excludes`/`compatible_with` only between solutions and components; constraint with a `how` link; function with mixed function and solution `how` targets. Errors name the link line and both types, or the function. Verify with one test per scenario of "Link type pairs" (`npm test`)
- [x] 1.5 Root and reachability: exactly one function with no incoming `how`; every function, solution and component reaches it backwards; `how` cycle detection on `how` links; constraints exempt. Verify with tests: orphan solution, two roots, no root, cycle, two whys accepted (`npm test`)
- [x] 1.6 Output: top-level `root`; per node `why` and `how` (links-file order), `constrains` and `constrained_by` always present, `requires`/`excludes`/`compatible_with` as today (excludes symmetric); no `parent`, `parents`, `children`, `slot`; nodes sorted by id. Replace the old children/slot/parent tests. Verify with tests for `why`/`how` order, constraint lists, symmetric excludes, output independent of links order, failed build leaves `graph.json` untouched (`npm test`)

## 2. `tools/graph.py`

Note: tool tests use temporary folders; do not run the tool on the old `graph/` folder.

- [x] 2.1 Read side: types, `how`/`constrains` link types, `why`/`how` helpers replacing `parents_of`, shared type-pair and mixed-children checks used by `new` and `link`. Verify with `python3 -m unittest discover tools`
- [x] 2.2 `new`: `--type` required (function, solution, component, constraint), `--why <id>` (repeatable) creating `how` links from each why, `--constrains <id>` for constraints; no why only for the first function of an empty graph; refuse missing why, unknown id, forbidden pair; flat file named from the title. Update `tools/test_graph.py` (first function, missing parent, forbidden pair, unknown parent, new constraint). Verify with `python3 -m unittest discover tools`
- [x] 2.3 `link` and `unlink` with `--how`, `--constrains` besides the three existing flags; refuse duplicate, forbidden pair, `how` cycle, mixed children; canonical rewrite kept. Tests for second why, cycle, forbidden pair, mixed children, remove, ambiguous prefix. Verify with `python3 -m unittest discover tools`
- [x] 2.4 `tree`: `how` tree from the root, children ordered by title, `[AND]` on function children and `[OR]` on solution children, repeats marked with children listed once, constraints shown under the function they constrain as `[constraint]`. Tests for two whys and labels. Verify with `python3 -m unittest discover tools`
- [x] 2.5 `lint`: implied `how` link, unreachable nodes, `requires`+`excludes` pair, stale hints, mixed function children, constraint without `constrains` (the forbidden type pair check stays in `link`/`new` and the build, since the spec lists none for lint); exit 1 on findings, silent and 0 when clean. Tests for each finding and the clean case. Verify with `python3 -m unittest discover tools`

## 3. New demo graph

Authored with `tools/graph.py` commands only (never by editing `links.jsonl` by hand). Topic stays a DIY pen plotter; ids are generated, titles and structure are free. Old `raw/DIY A3 pen plotter - Claude.md` may be used for content. Every node gets sources (`LLM:<model>`, confidence low is fine).

- [x] 3.1 Delete the old `graph/` content (nodes, folders, `links.jsonl`) and the existing briefs in `briefs/` (they refer to removed ids; keep or recreate `briefs/index.json` as the tooling expects). Verify with `git status` showing the deletions and `ls graph` empty
- [x] 3.2 Functions skeleton: `new` the main function (first function of an empty graph), at least three first-level functions with `--why <main>`. Verify with `python3 tools/graph.py tree`
- [x] 3.3 Solutions: at least two solutions for each function whose how-targets are solutions (`new --type solution --why <function>`). Verify with `python3 tools/graph.py tree` (`[OR]` children, at least two each)
- [x] 3.4 Sub-functions and components: at least one solution that brings sub-functions (function children with their own solutions, depth 2 or more), at least one sub-function shared by two solutions (second `--why` or `link --how`), at least one solution with component children. Verify with `python3 tools/graph.py tree` (repeat marked on the shared function) and `python3 tools/graph.py lint`
- [x] 3.5 Constraints: at least two constraint nodes with `new --type constraint --constrains <function>`, bodies describing the kind of limit and how solutions are affected. Verify with `grep -E "A3|\\$" ` on the constraint files (no target values) and `python3 tools/graph.py tree` showing `[constraint]` lines
- [x] 3.6 Cross links: at least five `requires`/`excludes` links between solutions of different functions (`link --requires/--excludes`). Verify with `python3 tools/graph.py lint` (no output)
- [x] 3.7 Bodies: each function and solution body says why it matters or why it would be chosen and its tradeoffs; each cross link is explained in the declaring body; no target values (paper format, price) anywhere as targets; the main function body names no values. Verify with `python3 tools/graph.py format` then `npm run build` and `python3 tools/graph.py lint` (both clean)
- [x] 3.8 Check the demo requirements: 15 to 30 nodes, one root, at least three first-level functions, shared sub-function, components, two constraints, five cross links, sources on every node. Verify with `node -e` on `graph.json` and `python3 tools/graph.py tree`

## 4. Viewer

Note: tests in `test/viewer.test.mjs` read the real `graph.json`; they go green once the new demo graph (group 3) and this group are in. Test titles and ids come from the new graph, not the old one.

- [x] 4.1 `viewer/app.js`: use `graph.root` (no `type === 'root'` search) and `why`/`how`. `viewer/select.js`: add `decisions(graph)` (functions whose `how` targets are solutions); `toggle` replaces the selected solution of the same function (same `why`); `undecided` uses `decisions`. Update `test/viewer.test.mjs` to the new demo graph (titles and ids looked up from it) and add tests for `decisions` and one solution per function. Verify with `npm test`
- [x] 4.2 `viewer/outline.js`: preorder from `graph.rootId` over `how`, repeats marked, then constraint nodes as a separate group of rows (no tags, no selection). Tests: order and depths 0..2, shared function repeated once without its children, constraints after the tree. Verify with `npm test`
- [x] 4.3 Remove the top bar: delete `viewer/views/topbar.js` and its mount, page shell and styles; add a small header at the top of the main view (`views/main.js`) with the counts picked, undecided and problems and the Reset button (shown only when something is selected, keeps the open node); wrap on narrow screens. Nothing about pills, first-level grouping or "Other". Verify with `npm test` and a headless Chrome DOM check: no top bar element, header counts update when a solution is selected, Reset empties the selection
- [x] 4.4 `viewer/views/graph.js` and `views/main.js`: types `solution`, `function`, `constraint`, `component` replace `option`/`decision` (toggle only on solutions, disabled and `excluded by` as today, `undecided` tag on decisions, function/constraint/component line opens the modal); chosen-solution heading uses the solution's function title. Verify with headless Chrome DOM check on the new graph: clicking a solution line selects it, a solution it excludes shows `excluded by <title>`, nothing selected shows `undecided` on every decision
- [x] 4.5 `viewer/views/node.js`: show `why` and `how` links, `constrains` and `constrained_by` links, the existing edges, the choose action for solutions, and for a decision its solutions with Choose buttons. Verify with headless Chrome DOM check: open a solution that brings sub-functions (links to its why function and to its sub-functions), open a constraint (link to the function it constrains), Esc closes without changing the selection
- [x] 4.6 Check the whole page in headless Chrome at wide and narrow widths with a `?pick=` hash made of ids of the new graph. Verify with the DOM check showing the picked solutions, the main view header, no horizontal scroll, no console errors, and `npm test`

## 5. Brief prompt

- [x] 5.1 `viewer/brief.js` (`buildPrompt`): "Decision:" line names the solution's function (first `why`), undecided list built from the undecided functions; `prompts/brief.md` wording ("options" to "solutions", "Undecided decisions" to "Undecided functions"), prompt version bumped so existing briefs read as stale. Update the prompt test in `test/viewer.test.mjs`. Verify with `npm test` (prompt has body, missing requirement and undecided functions) and `npm run brief` smoke check if a brief file is at hand

## 6. README

- [x] 6.1 Rewrite the node format, links file and graph tool sections: new types, flat `graph/`, `how` and `constrains`, removal of `parent` and `slot`, `graph.json` shape (`root`, `why`, `how`, `constrains`, `constrained_by`), `new --why`, `link --how/--constrains`, `tree` labels, lint list. Verify with `grep -n "slot\|parent\|decision\|option" README.md` showing only intended uses
- [x] 6.2 Update the viewer section (no top bar, header with counts and Reset in the main view, outline from `how` with constraints group, node modal) and refresh `docs/` screenshots (the layout changed: no top bar). Verify by reading the section against the running page

## 7. Final checks

- [x] 7.1 Run `npm test`, `python3 -m unittest discover tools`, `npm run build`, `python3 tools/graph.py lint`. Verify: all green, lint prints nothing
- [x] 7.2 Run `openspec validate fast-graph-model`. Verify: valid
- [x] 7.3 Confirm the demo against the `pen-plotter-demo-graph` requirements (15 to 30 nodes, one root, structure, constraints, cross links, sources on every node), that `graph/` has no old content and `briefs/` no stale briefs. Verify with `node -e` on `graph.json` and one last headless Chrome load with no console errors

## 8. Author order, demo adjustments, type icons

Note: 8.1 to 8.4 come first (format and tool), then 8.5 and 8.6 on the demo graph, then 8.7 to 8.9 on the viewer. Use `tools/graph.py` only for links; node bodies are edited by hand.

- [x] 8.1 `scripts/build-graph.mjs`: accept `order` on `how` links (integer, else error naming the line; on other link types, error naming the line); `how` lists sorted by order, then unordered by title then id; `why` unchanged. Tests in `test/build-graph.test.mjs`: order sorts, unordered after ordered, non-integer, order on `requires`, output independent of file order. Verify with `npm test`
- [x] 8.2 `tools/graph.py`: key order `from`, `to`, `type`, `order`, `src`, `hint`; read side keeps `order`; `link --how --order N` (and error when `--order` has no `--how`); keep `order` on rewrite. Tests for canonical key order and `--order`. Verify with `python3 -m unittest discover tools`
- [x] 8.3 `tools/graph.py`: `order <parent> <child>...` (children must be existing how-children, no repeat; unlisted lose `order`; canonical write, hints refreshed; other parents untouched); `tree` prints children in the `how` order. Tests: set, not a child, reorder, per parent, tree order. Verify with `python3 -m unittest discover tools`
- [x] 8.4 `tools/graph.py lint`: report a node whose how-children are partly ordered. Tests: partly ordered finding, none ordered and all ordered clean. Verify with `python3 -m unittest discover tools`
- [x] 8.5 Demo (B): `link --how` "Guide the axes" from each gantry solution (Cartesian, CoreXY, Single-rail cantilever), `unlink` it from the main function; check constraint links (Paper format, Line quality) still make sense; update the bodies of the main function, "Guide the axes" and the three gantry solutions. Verify with `python3 tools/graph.py tree` (Guide the axes under each gantry solution, three first-level functions) and `python3 tools/graph.py lint`
- [x] 8.6 Demo (A): set an order with `graph.py order` on every node that has how-children (main function: move, lift, G-code; gantry solutions: transmit, guide, square; solutions from most common or recommended to least). Verify with `python3 tools/graph.py tree`, `python3 tools/graph.py lint` (no output) and `npm run build`
- [x] 8.7 `viewer/outline.js` order: the outline follows the `how` list as built (no re-sorting). Test in `test/viewer.test.mjs` with a small graph whose `how` list is not in title order. Verify with `npm test`
- [x] 8.8 Type icons: `viewer/icons.js` (inline SVG per type, no external assets, theme colours), used in each outline line before the title (replacing the dot) and in the modal title; legend at the top of the graph panel; fixed row height kept; styles in `viewer/style.css`. Verify with `npm test` and a headless Chrome DOM check: one icon per line, four different shapes, legend present, icon in the modal title, same row height, no console errors
- [x] 8.9 README (order field, `order` command, `--order`, tree order, icons and legend) and refresh `docs/selection.png` and `docs/node-modal.png`. Verify with `grep -n "order" README.md` and by viewing the screenshots
- [x] 8.10 Final checks: `npm test`, `python3 -m unittest discover tools`, `npm run build`, `python3 tools/graph.py lint` (prints nothing), `openspec validate fast-graph-model`. Verify: all green
