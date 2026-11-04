# Design space explorer

An LLM-maintained wiki of design decisions, stored as a graph of Markdown nodes. First topic: a DIY pen plotter.

## Layout

- `graph/`: one Markdown file per node, and `links.jsonl` with all links
- `tools/graph.py`: the tool that edits nodes and links
- `scripts/build-graph.mjs`: validates the nodes and compiles them to `graph.json`
- `graph.json`: compiled output (committed)
- `raw/`: source material (web pages, chats, notes). Git-ignored and never read by the build.

## Node format

The graph is a FAST-style tree of functions and solutions (what must be done, and how). A node is a Markdown file directly under `graph/` (subfolders are rejected) with YAML frontmatter and a free prose body. Its id is the frontmatter `id`: 8 lowercase hex characters, unique in the graph, written in quotes. The file name means nothing to the graph (the tool creates `graph/<slug>.md`). Links are not in the node file; they live in `graph/links.jsonl`.

```markdown
---
id: "861c9946"
title: CoreXY
type: solution
sources: ["LLM:claude-sonnet"]
confidence: low
---
Why it would be chosen, the tradeoffs, and why each link to it exists.
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | 8 lowercase hex characters, quoted |
| `title` | yes | |
| `type` | yes | `function`, `solution`, `component` or `constraint` |
| `sources` | yes | non-empty list of free text: a URL, `user`, or `LLM:<model>` |
| `confidence` | no | `low`, `medium` or `high`; use `low` for unchecked LLM content |

`slot`, `parent`, `requires`, `excludes` and `compatible_with` are not allowed in the frontmatter: the build fails if it finds them.

The root is the **main function**: the one function with no "why". Constraint nodes hold prose only: the kind of limit and how solutions fare. Values such as a paper format or a price belong to design documents, not to the graph.

## Links file

`graph/links.jsonl` holds every link, one JSON object per line:

```
{"from":"861c9946","to":"b3a8fe22","type":"how","src":"user","hint":"CoreXY > Transmit motor motion"}
```

| Field | Notes |
| --- | --- |
| `from`, `to` | node ids |
| `type` | `how`, `constrains`, `requires`, `excludes` or `compatible_with` (below) |
| `order` | `how` links only, optional integer: position of the target among the source's children (per parent). Display order, e.g. 1 = most common or recommended |
| `src` | who or what made the link: free text, like node `sources` (`user`, `LLM:<model>`, ...) |
| `hint` | titles for people reading `git diff`; written by the tool, ignored by the build |

- `how` goes from the "why" end to the "how" end, and its meaning comes from the node types: function to function is a sub-function (AND), function to solution is an alternative (OR), solution to function is a sub-function the solution brings (AND), solution to component is a part. A function's `how` targets are all functions or all solutions. A node may have several whys (a shared sub-function). Exactly one function has no why (the root), every function, solution and component must reach it, no cycles.
- `constrains` goes from a constraint to a function it limits. A constraint has no `how` links.
- `requires` (the target must also be selected), `excludes` (cannot be selected together, symmetric in the output) and `compatible_with` (informational) join solutions and components only.

Canonical form: lines sorted by `type`, `from`, `to`, keys in the order `from`, `to`, `type`, `order`, `src`, `hint`, compact JSON, no duplicate (`type`, `from`, `to`). The build accepts any valid order; `tools/graph.py format` restores it. Don't edit the file by hand: use the tool below, so every change is one readable line in `git diff`.

`graph.json` has a top-level `root` id and, for each node, `why` and `how` (`why` in file order; `how` sorted by the links' `order`, then links without `order` by title, so the author's order is the display order), `constrains` and `constrained_by` (always present), and `requires`, `excludes`, `compatible_with`. Nodes are sorted by id.

## Editing the graph

`tools/graph.py` (Python 3, standard library only) is the one way to edit nodes and links. Python is only needed to edit the graph, not to build or view it. Nodes are given by id or by a unique prefix of it.

```sh
python3 tools/graph.py new "Draw on paper" --type function --source user          # the first function is the root
python3 tools/graph.py new "Rack and pinion" --type solution --why b3a8 --source "LLM:claude-sonnet" --confidence low
python3 tools/graph.py new "Paper format" --type constraint --constrains b3a8
python3 tools/graph.py link <new id> --requires e67a --src "LLM:claude-sonnet"
python3 tools/graph.py link f196 --how <new id>           # a second why for a node
python3 tools/graph.py unlink f196 --how <new id>
python3 tools/graph.py order b3a8 <child> <child> ...     # children of b3a8 in that order (1..n); unlisted children lose their order
python3 tools/graph.py link b3a8 --how <new id> --order 2 # or set the position of one new link
python3 tools/graph.py tree     # how tree from the root in author order, [AND] / [OR] / [part] / [constraint] labels, repeats marked
python3 tools/graph.py lint     # prints findings, exit 1 if any, writes nothing
python3 tools/graph.py format   # rewrite links.jsonl canonically, refresh hints
```

`new` needs `--type` and a `--why` (repeatable; `--constrains` for a constraint), so no node is born unreachable; only the first function of an empty graph may have none. It prints the id and writes `graph/rack-and-pinion.md` (body empty, to be written) and its links. `link` refuses duplicates, `how` cycles, type pairs the format forbids and a function that would get both function and solution targets. `lint` reports redundant `how` links (already implied through another path), nodes unreachable from the root, `requires` together with `excludes` on the same pair, functions with mixed function and solution children, constraints with no `constrains` link, and parents whose how children are only partly ordered, and stale hints (run `format` after renaming a node). The build is still the full validator: run `npm run build` after editing. Tests: `python3 -m unittest discover tools`.

## Build

```sh
npm install
npm run build   # graph/ -> graph.json
npm test
```

The build prints every error and writes nothing if validation fails.

## Viewer

A static page (plain HTML and ES modules, no build step) to browse the graph and try combinations of solutions.

```sh
npm run build   # refresh graph.json
npm run serve   # prints http://localhost:8080/viewer/ (pass a port: npm run serve -- 9000)
```

![Viewer with a selection: outline graph on the left, chosen solutions on the right](docs/selection.png)

One full-width page, no tabs and no top bar:

- **Left panel (graph)**: a legend of the four type icons (function ring, solution diamond, component square, constraint triangle), then the whole `how` tree as an indented outline in the author's order, one fixed-height line per node starting with its type icon, indentation encodes depth, followed by the constraint nodes as a separate group. A node with several whys is repeated, with its children listed once. A *decision* is a function whose how-targets are solutions. Right of the names, three lanes aligned across all lines: **state tags** (`chosen`, `excluded by X`, `undecided`, `needs X`, `needed by X`, `conflict`), a **link lane** where curves join the lines of linked nodes (`requires` with an arrow, `excludes` red dashed, `compatible_with` dotted; faint, lit for the open or hovered line), and a **`?` button** that opens the node. Clicking a solution's line **toggles** it (one solution per decision; a solution excluded by the selection is disabled and names the cause). Clicking a function, component or constraint opens it.
- **Right panel (main view)**: a small header with the counts (picked, undecided, problems) and **Reset** (shown when something is selected), then the brief or prompt box, conflicts, required-but-unselected nodes, the chosen solutions with their text, and undecided decisions.
- **Node modal** over the page (Esc, `×` or a click outside closes it): type icon and title, text, sources, links for `why`, `how`, `constrains`, `constrained_by`, `requires`, `excludes` and `compatible_with`, a select/remove button for a solution, and for a decision its solutions with Choose buttons.

![Node modal over the page](docs/node-modal.png)

The selection and the open node live in the URL hash, so reload, sharing and the back button work: `#/?pick=<id>,<id>&view=<id>`, e.g. `#/?pick=861c9946,e67a2f12&view=18f0f7e8`. Old forms still open the page: `#/design`, `#/graph`, `#/selection`, and `#/browse/<node-id>` (as `view=<node-id>`).

Unknown ids in the hash are ignored with a notice.

## Briefs

The viewer makes no LLM calls. A written brief for a selection comes from an AI outside the page:

1. Select a combination, expand "Prompt for an AI brief" and press "Copy prompt".
2. Paste it into any AI and save its answer as a Markdown file, e.g. `brief.md`.
3. Store it: `npm run brief -- save 861c9946,e67a2f12 brief.md --model <model name>`.

Reload the page: the brief is shown at the top of the main view with the model name.

Cache layout: `briefs/<key>.md` (frontmatter `pick`, `content_hash`, `model`, `prompt_version`, `created`, then the Markdown) and `briefs/index.json` mapping each selection key to its file. The key does not depend on the order of the ids. Saving again for the same selection replaces the brief. The prompt template is `prompts/brief.md`.

A brief is marked **stale** when the title, body, sources, `requires` or `excludes` of a selected node changed after it was saved. The prompt box is then shown again so a new brief can be made. Changes to unrelated nodes do not matter.
