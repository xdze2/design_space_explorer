# Proposal

## Why

The knowledge graph is meant to be an agnostic, growing base, shared by several design documents. Its structure does not yet say *why* a choice exists or *how* a function is achieved. Every decision hangs flat under a topic root. The tree is stored twice: once in folders and once in `parent` links. Specs such as "A3, about $150" are mixed into the root's prose. Following a FAST diagram (function: how / why), the graph becomes an AND/OR tree of functions and solutions. The later changes depend on it: design documents, relevance of open choices, the BOM, and LLM research requests.

## What Changes

- **BREAKING** Node types become `function`, `solution`, `component` and `constraint`. `root`, `decision` and `option` are removed. The root is the **main function**: the one function with no "why".
- **BREAKING** The `parent` link is replaced by one structural link, `how`, from the "why" end to the "how" end. Its meaning comes from the node types:
  - function -> function: sub-function (AND)
  - function -> solution: alternative (OR)
  - solution -> function: sub-function the solution brings (AND)
  - solution -> component: part (later BOM)

  A function's `how` targets are either all functions or all solutions. A node may have several "why"s (a shared sub-function).
- New link `constrains`: constraint -> function. Constraint nodes hold prose only (the kind of limit and how solutions are affected). Values such as "paper <= A3" belong to future design documents, not to the graph.
- `requires`, `excludes` and `compatible_with` are unchanged.
- **BREAKING** Node files are stored flat under `graph/`, and the build rejects subfolders. The tree comes only from links.
- **BREAKING** `graph.json` gives each node `why` and `how` lists (no more `parent`, `parents` and `children`) and a `root` id. The `slot` field is removed.
- `tools/graph.py` follows the model: `new --why <id>`, `link --how/--constrains`, `tree` and `lint` work on `how` links. Lint adds checks for mixed function children and for type pairs a link does not allow.
- The demo plotter graph is replaced, not migrated. The current data is demo only. The old `graph/` content is deleted and a new demo graph is authored from scratch in the FAST model with `tools/graph.py` (new generated ids, new titles and structure, topic still a DIY pen plotter):
  - one main function, at least three first-level functions
  - alternatives at depth 2 under a solution (sub-functions a solution brings), a sub-function shared by two solutions, a solution with components
  - "Guide the axes" is a sub-function brought by each gantry solution (shared, several whys), not a first-level function
  - constraint nodes without target values, and `requires`/`excludes` links between solutions of different functions
- **Author-chosen child order.** A `how` link MAY carry an integer `order` (per parent). The `how` list of each node in `graph.json` is sorted by it, and the outline and `graph.py tree` show that order. `graph.py` gets an `order` command and `link --how --order N`; lint reports partly ordered children.
- The viewer adopts the new model: the outline from `how` links, "decisions" read as functions with solutions. **BREAKING** The top bar is removed. Its selection counts (picked, undecided, problems) and the Reset button move into a small header at the top of the main view (right panel). Selection still lives in the URL hash for now.

- The outline and the node modal show a small icon for each node type, and the graph panel has a short legend.

Out of scope:
- The design document (JSON file, browse/edit split, statuses, rejected reasons). That is the next change, `design-document`.
- Hiding sub-functions of unchosen solutions in the viewer. The graph makes it possible; the viewer adopts it with the design document.
- The local backend, research requests, the BOM view, typed constraint values, and any solver.
- A breadcrumb showing the open node's why-path (and any replacement for the removed top-bar pills): planned for the next change, `design-document` (navigation redesign).
- The old `edit-mode` change: dropped, superseded by a later local-backend change.

## Capabilities

### New Capabilities
<!-- None: the FAST model is a revision of the existing graph format. -->

### Modified Capabilities
- `knowledge-graph-format`:
  - new node types
  - the `how` and `constrains` links replace `parent`
  - type-pair rules and the "all functions or all solutions" rule
  - flat storage
  - new `graph.json` shape (`why`, `how`, `root`)
  - `slot` removed
  - optional `order` on `how` links, `how` lists sorted by it
- `graph-tool`: create nodes with a "why", add and remove `how` and `constrains` links, tree and lint on the new model, an `order` command, `--order` on `link --how`, tree in author order, lint for partly ordered children.
- `pen-plotter-demo-graph`: a new demo graph, with structural requirements (counts, alternation, shared sub-function, components, constraints, cross links) instead of specific ids.
- `node-slots`: removed. Groups are no longer needed.
- `graph-viewer`: the outline is built from `how` links in the author's order, tags use the new types, and each line and the modal show a type icon with a legend.
- `design-page`: the top bar is removed; counts and Reset move to a header in the main view; "decision" means a function with solutions.
- `selection-workspace`: wording no longer mentions the top bar.
- `selection-brief`: the prompt lists undecided functions instead of undecided decisions.

## Impact

- `scripts/build-graph.mjs`: validation rules and `graph.json` output.
- `tools/graph.py` and its tests.
- `graph/`: all old content deleted (nodes, folders, `links.jsonl`) and a new demo graph authored with `tools/graph.py`. Old ids and old `?pick=` hashes stop working.
- `briefs/`: existing briefs are deleted along with the old graph, since they refer to removed ids.
- `viewer/`: `select.js`, `outline.js`, `views/main.js`, `views/node.js` and `views/graph.js` read the new fields; `views/topbar.js` is removed and the main view gets a header.
- `raw/`: old source material may be used for the new content, not changed.
- The build on the real `graph/` is red between the build change and the new demo graph; they land in one commit.
- `README.md`: the node format, links file, tool and viewer sections are rewritten.
