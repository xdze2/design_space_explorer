# Design

## Context

See proposal.md for motivation and scope. Current state, in short:

- `graph/` has nodes in folders (`gantry/`, `drive/`, ...) plus one `<topic>.md` per decision, and `links.jsonl` with `parent`, `requires`, `excludes`, `compatible_with` links (all `src: "migration"`).
- `scripts/build-graph.mjs` validates and writes `graph.json` (`parent`, `parents`, `children`, `slot`, plus the three constraint lists).
- `tools/graph.py` edits nodes and links; `viewer/` reads `parent`, `children`, `slot` and the types `root`/`decision`/`option` (`select.js`, `outline.js`, `views/topbar.js`, and the node and main views).
- The demo graph (21 nodes) is demo data only, possibly incomplete or not ideal. It is replaced, not migrated.

## Goals / Non-Goals

**Goals:**
- One structural link (`how`) that carries the AND/OR meaning from node types alone.
- A build that rejects every ill-formed tree, and a tool that makes the right edit the easy one.
- A new demo graph authored from scratch in the model with the tool itself, which also exercises the tool.
- The viewer works on the new model, without the top bar.

**Non-Goals:**
- Hiding sub-functions of unchosen solutions, design documents, BOM, typed constraint values, a solver (see proposal.md).
- Any new viewer feature beyond dropping the top bar. Where the viewer needs a rule ("decision"), it is the smallest one.
- A breadcrumb for the open node's why-path: planned for `design-document`.

## Decisions

### 1. Node types and the `how` link

Types: `function`, `solution`, `component`, `constraint`. `root`, `decision`, `option` and the `slot` field are removed (a `slot` in frontmatter is a build error, like other removed fields).

One structural link, stored `{"from": <why end>, "to": <how end>, "type": "how"}`. The type pair gives the meaning:

```
function  --how--> function    sub-function          (AND)
function  --how--> solution    alternative           (OR)
solution  --how--> function    sub-function it brings (AND)
solution  --how--> component   part                  (future BOM)
```

Any other pair is a build error. A function's `how` targets are all functions or all solutions, never mixed (build error): the node then reads unambiguously as "split into parts" or "choose one".

Rationale: a single direction (why -> how) matches the FAST reading order and replaces `parent` (child -> parent), which was only about folders. Alternative considered: two link types (`decomposes`, `implemented_by`). Rejected: the node types already say which one it is, and two types would allow contradictions.

`how` links form no cycle. A node may have several "why"s (a shared sub-function), as `parent` allowed several parents.

### 2. The root is the main function

The root is the only function with no incoming `how`. Exactly one must exist (build error otherwise). Every function, solution and component must reach it by following `how` links backwards. Solutions and components with no why are therefore also "unreachable" errors. This replaces the `type: root` check and keeps the same reachability rule.

### 3. `constrains` and constraint nodes

`constrains` goes constraint -> function. Constraint nodes have no `how` links and hold prose only: the kind of limit and how solutions fare against it. Concrete values ("A3", "$150") belong to future design documents, because the graph is shared by several designs and a value is a property of one design.

- Build: `constrains` must go from a `constraint` to a `function`; a constraint with `how` links (either end) is an error.
- Lint (not build): a constraint with no `constrains` link. It is a hygiene warning, a draft constraint should not break the build.
- A constraint is not part of the tree, so it is not subject to the reachability rule.

### 4. `requires` / `excludes` / `compatible_with` only between solutions and components

Same meaning as today. The build rejects them on function and constraint nodes (type-pair error). Reason: selecting is a choice among solutions (and later components); a function is "satisfied" by whichever solution is picked, so "function X requires Y" would have no clear semantics, and the viewer's selection logic only knows selectable nodes. Alternative: allow them anywhere and ignore them in the UI. Rejected: silent no-ops are worse than a build error.

### 5. Flat storage

All node files sit directly under `graph/`; the build fails on any `.md` in a subfolder (the error names the file). The tree comes from links only, so there is a single source of truth. `graph.py new` already creates flat files.

### 6. `graph.json` shape

```
{
  "root": "<id>",
  "nodes": [
    {
      "id": "<id>",
      "title": "Move the pen in XY",
      "type": "function",
      "sources": [...], "confidence": "low",   // as today, when present
      "body": "...",
      "why": ["<id>"],             // link-file order
      "how": ["<id>", "<id>", ...],   // sorted by link `order`, see decision 9
      "constrains": [],                // function side: empty; constraint side: function ids
      "constrained_by": ["<constraint id>"],   // function side: constraint ids
      "requires": [], "excludes": [], "compatible_with": []   // as today; excludes symmetric
    }
  ]
}
```

Details: nodes sorted by id; `why` in links-file order; `how` sorted by the links' `order` (decision 9); `constrains` and `constrained_by` are always present on every node (empty list when not used) so consumers need no `?? []`; `requires/excludes/compatible_with` keep today's rules, sorted deterministically as now. `parent`, `parents`, `children` and `slot` are gone. Alternative: also emit `how` as typed edges. Rejected: the types are on the nodes.

### 7. `tools/graph.py`

```
new "Title" --type function|solution|component --why <id> [--why <id>...]
new "Title" --type constraint --constrains <id>
link <a> --how <b>        link <c> --constrains <f>
unlink <a> --how <b>      unlink <c> --constrains <f>
tree     lint     format
```

- `new` requires at least one `--why` (or `--constrains` for a constraint), so no node is born unreachable. The only node allowed without `--why` is the first function of an empty graph (the root). `--type` is required (no default).
- `link`/`unlink` keep their `requires`/`excludes`/`compatible_with` flags, `--src`, cycle refusal, canonical rewrite. `link --how` also refuses a forbidden type pair and a mixed function child (clearer than failing at build).
- `tree` prints the `how`-tree from the root; children of a function are tagged by what they are, e.g. `[AND]` for function children and `[OR]` for solution children (printed on the child line, in the `how` order of decision 9); repeats are marked as today and their children are listed once. Constraints are shown under the function they constrain, marked `[constraint]`, so the outline mirrors what the viewer will want.
- `lint` (read-only, exit 1 on findings) keeps: redundant `how` link (a direct link already implied through another path), unreachable nodes, `requires` + `excludes` on the same pair, stale hints. New: partly ordered children (decision 9), mixed function children (duplicates the build on purpose: lint is the quick pre-check) and constraint without `constrains`. Forbidden type pairs are refused by `link` and by the build, so lint does not repeat them.

### 8. Viewer (minimal)

- Outline: preorder walk from `graph.root` over `how` in the `graph.json` order (was `children` from the root). Constraint nodes are listed after the tree as a separate group (plain lines that open their modal, no selection, no tags); the modal shows `constrains`/`constrained_by`. They have no place in the how-tree, and a flat group after it avoids inventing one.
- A "decision" is a function whose `how` targets are solutions. One solution per decision: picking a solution replaces the previous one of the same function (same `why`). Solutions' own `how` (sub-functions) are just outline children, nothing is hidden.
- Top bar removed (`views/topbar.js` deleted). The main view gets a small header with the counts (picked, undecided, problems) and the Reset button (shown only when something is selected), above the existing sections. No pills, no grouping by first-level function, no "Other" group. Nodes are opened from the outline lines, the `(?)` button and links in the main view.
- Undecided = decisions (as above) with no chosen solution. Brief prompt lists undecided functions.
- Selection stays in the URL hash.
- Code touched: `select.js`, `outline.js`, `views/main.js`, `views/node.js`, `views/graph.js` (type labels/tags), the page shell and styles. A small helper `decisions(graph)` in `select.js` avoids repeating the rule.

Known quirk, accepted: a shared function is one decision, repeated in the outline under each solution that brings it. Picking a solution for it in one place picks it for all. That is the point of sharing.

### 9. Author-chosen order of `how` children

The order of a node's children is a design choice (most common or recommended first, the way a designer reads the topic), not an accident of ids. A `how` link MAY carry an integer `order` field; key order in `links.jsonl` becomes `from`, `to`, `type`, `order`, `src`, `hint`, and the canonical line sort stays `type`, `from`, `to`. The order is per link, so per parent: a shared sub-function can sit at a different place under each of its whys.

- Build: `order` must be an integer when present (error names the line); `order` on a non-`how` link is an error. Alternative considered: a per-node `children` list in frontmatter. Rejected: a second place for the tree, which flat storage was meant to remove.
- `graph.json`: each node's `how` is sorted by `order` ascending (ties and links without `order` after the ordered ones, then by title, then id, so the output is deterministic). `why` stays in links-file order.
- Viewer outline and `graph.py tree` both use that `how` order (the tree used to sort by title).
- `graph.py order <parent> <child>...` sets `order` 1..n on the parent's `how` links to the listed children, in the given order. Every listed child must be an existing `how` child (error otherwise, nothing written); children not listed lose their `order`. It rewrites the file canonically and refreshes hints. `link --how <b> --order N` sets `order` on a new link.
- Lint reports a parent whose `how` children are partly ordered (some with `order`, some without). A parent with none ordered is fine (title order), a parent with all ordered is fine.

### 10. Node-type icons

The outline shows a small icon before each title, by type: function, solution, component, constraint. Icons are inline SVG (or CSS shapes), no external assets, coloured from the existing theme, and sized inside the fixed row height. They replace the old state `dot` shapes, which tried to say type and state at once: state stays in the tags and the row colour (chosen rows keep their green background and a green icon). A short legend (the four icons with their names) sits at the top of the graph panel. The node modal shows the same icon next to the title. One small helper (`viewer/icons.js`) builds an icon for a type, used by the outline, the legend and the modal.

## Demo graph replacement

No migration. The current plotter data is demo only, so the change deletes the old `graph/` content (nodes, folders, `links.jsonl`) and `briefs/` (they refer to removed ids), then authors a new demo graph from scratch with `tools/graph.py`, so `links.jsonl` stays canonical and the tool is tested on real work. Ids are generated by the tool; titles and structure are free, topic stays a DIY pen plotter. Old `raw/` material may be used for content.

Structural requirements (see the `pen-plotter-demo-graph` delta): one main function; at least three first-level functions; alternatives at depth 2 or more under a solution (AND/OR alternation, e.g. sub-functions a gantry solution brings); at least one sub-function shared by two solutions ("Transmit motor motion" and "Guide the axes", each brought by every gantry solution); at least one solution with components; at least two constraint nodes with `constrains` links and no target values (such as a paper format or a price); at least five `requires`/`excludes` links between solutions of different functions, explained in bodies; bodies that say why and tradeoffs; sources on every node (`LLM:<model>`, confidence low, is fine); 15 to 30 nodes; build and lint pass.

After authoring, an order is set on the whole demo graph with `graph.py order` (main function: move the pen in XY, lift and lower the pen, turn G-code into motion; solutions from most common or recommended to least). "Guide the axes" is not a first-level function: each gantry solution brings it, since the choice of guide depends on the gantry.

Order of work: build and `graph.json` (tests use temporary folders), then the tool, then delete the old graph and author the new one, then the viewer. Between the build change and the new graph, `npm run build` on the real `graph/` is red; these land in one commit.

Rollback: revert the commit. The old data has no copy outside git.

## Risks / Trade-offs

- [A shared sub-function repeats in the outline under each solution that brings it, longer outline] -> Children are listed once at first occurrence and repeats are marked, as the viewer already does for multi-parent nodes.
- [Strict build rules (mixed children, type pairs) make an LLM edit fail late] -> `graph.py link/new` and `lint` check the same rules early; the build message names the link line.
- [Breaking `graph.json` shape; old `?pick=` hashes and briefs stop working] -> Accepted: the demo data is replaced and briefs are deleted. Viewer, build and new graph change in one commit.
- [Removing the top bar loses the quick pill overview and the grouping] -> Accepted; the outline shows the same state tags. Navigation is redesigned in `design-document`.
- [Removing `slot` loses a manual grouping] -> Accepted; nothing uses it once the top bar is gone.
- [A new graph authored by hand may have gaps] -> The structural requirements and lint are the checklist; content is demo and marked `LLM:<model>`, low confidence.

## Open Questions

- A breadcrumb showing the open node's why-path, and what replaces the top-bar pills, are planned for the next change, `design-document` (navigation redesign).
- Should constraints move from the group after the tree to the functions they constrain once designs exist? To be decided with `design-document`.
- Should `tree` hide constraints behind a flag if the list grows? Revisit when there are many.
