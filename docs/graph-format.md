# Graph format

## Node format

The graph is a FAST-style tree of functions and solutions (what must be done, and how). A node is a Markdown file directly under `knowledge_graph/` (subfolders are rejected) with YAML frontmatter and a free prose body. Its id is the frontmatter `id`: 8 lowercase hex characters, unique in the graph, written in quotes. The file name means nothing to the graph (the tool creates `knowledge_graph/<slug>.md`). Links are not in the node file; they live in `links.jsonl` next to them.

```markdown
---
id: "861c9946"
title: CoreXY
type: solution
sources: ["LLM:claude-sonnet"]
confidence: low
summary: Two fixed motors and crossed belts move a light beam
abbr: COXY
---
Why it would be chosen, the tradeoffs, and why each link to it exists.
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | 8 lowercase hex characters, quoted |
| `title` | yes | |
| `type` | yes | `function`, `solution`, `component` or `constraint` |
| `sources` | yes | non-empty list of free text: a public URL, `user`, or `LLM:<model>`. Never a `raw/` file: readers of the repository cannot open it, so cite the page's URL instead (`graph.py lint` reports it) |
| `confidence` | no | `low`, `medium` or `high`; use `low` for unchecked LLM content |
| `summary` | no | one line (at most 120 characters) saying what the node is; shown on its card. `graph.py lint` asks for one on every solution and component |
| `abbr` | no | 1 to 4 letters or digits for the picture tile of a node without a picture; the default is derived from the title (`NEMA 17 steppers` gives `N17S`) |

`slot`, `parent`, `requires`, `excludes` and `compatible_with` are not allowed in the frontmatter: the build fails if it finds them.

**Pictures.** A node may have a picture: a monochrome SVG at `knowledge_graph/img/<id>.svg` (named by id, so a retitle keeps it; at most 50 kB). The build fails on any other file in `img/` and sets `img: true` on the nodes that have one. The viewer shows it through `<img>`, so a picture can never run script. Style, so the pictures look like a set: `viewBox="0 0 120 90"`, `stroke="#555"`, `stroke-width="2"`, `fill="none"` (the same grey may fill a motor), no `<text>`, a schematic top view of the mechanism. Nodes without a picture get a tile with their abbreviation.

The root is the **main function**: the one function with no "why". Constraint nodes hold prose only: the kind of limit and how solutions fare. Values such as a paper format or a price belong to design documents, not to the graph.

## Links file

`links.jsonl` holds every link, one JSON object per line:

```
{"from":"861c9946","to":"b3a8fe22","type":"how","src":"user","hint":"CoreXY > Transmit motor motion"}
```

| Field | Notes |
| --- | --- |
| `from`, `to` | node ids |
| `type` | `how`, `constrains`, `requires`, `excludes`, `compatible_with` or `fares` (below) |
| `order` | `how` links only, optional integer: position of the target among the source's children (per parent). Display order, e.g. 1 = most common or recommended |
| `score` | `fares` links only, required: -2, -1, 1 or 2 (never 0: no link means neutral) |
| `src` | who or what made the link: free text, like node `sources` (a public URL, `user`, `LLM:<model>`, never a `raw/` file) |
| `hint` | titles for people reading `git diff`; written by the tool, ignored by the build |

- `how` goes from the "why" end to the "how" end, and its meaning comes from the node types: function to function is a sub-function (AND), function to solution is an alternative (OR), solution to function is a sub-function the solution brings (AND), solution to component is a part. A function's `how` targets are all functions or all solutions. A node may have several whys (a shared sub-function). Exactly one function has no why (the root), every function, solution and component must reach it, no cycles.
- `constrains` goes from a constraint to a function it limits. A constraint has no `how` links.
- `requires` (the target must also be selected), `excludes` (cannot be selected together, symmetric in the output) and `compatible_with` (informational) join solutions and components only.
- `fares` goes from a solution or component to a constraint and says how it does against it: `score` -2 (much worse), -1, 1, 2 (much better). The score is relative to the alternatives under the same function, not absolute, and the node's body should say why. It is informational (it never restricts a choice) and shows as a badge on the card (`++ Drawing speed`, `− Budget`).

Canonical form: lines sorted by `type`, `from`, `to`, keys in the order `from`, `to`, `type`, `order`, `score`, `src`, `hint`, compact JSON, no duplicate (`type`, `from`, `to`). The build accepts any valid order; `tools/graph.py format` restores it. Don't edit the file by hand: use the tool described in [Editing the graph](editing.md), so every change is one readable line in `git diff`.

## graph.json

`graph.json` has a top-level `root` id and, for each node, `why` and `how` (`why` in file order; `how` sorted by the links' `order`, then links without `order` by title, so the author's order is the display order), `constrains` and `constrained_by` (always present), and `requires`, `excludes`, `compatible_with`, and `fares` (a list of `{id, score}` sorted by id, always present), plus `img: true` on a node with a picture. Nodes are sorted by id.

## Build

```sh
npm install
npm run build             # topics/pen_plotter/knowledge_graph -> topics/pen_plotter/graph.json
npm run build -- <topic>  # another topic
npm test
```

The build prints every error and writes nothing if validation fails.
