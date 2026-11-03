# Design space explorer

An LLM-maintained wiki of design decisions, stored as a graph of Markdown nodes. First topic: a DIY A3 pen plotter.

## Layout

- `graph/`: one Markdown file per node, and `links.jsonl` with all links
- `tools/graph.py`: the tool that edits nodes and links
- `scripts/build-graph.mjs`: validates the nodes and compiles them to `graph.json`
- `graph.json`: compiled output (committed)
- `raw/`: source material (web pages, chats, notes). Git-ignored and never read by the build.

## Node format

A node is a Markdown file under `graph/` with YAML frontmatter and a free prose body. Its id is the frontmatter `id`: 8 lowercase hex characters, unique in the graph, written in quotes. The file name and folder mean nothing to the graph (new files are created flat as `graph/<slug>.md`). Links are not in the node file; they live in `graph/links.jsonl`.

```markdown
---
id: "861c9946"
title: CoreXY
type: option
sources: ["LLM:sonnet-5.5"]
confidence: low
---
Why it would be chosen, the tradeoffs, and why each link to it exists.
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | 8 lowercase hex characters, quoted |
| `title` | yes | |
| `type` | yes | `root`, `decision`, `option` or `component` |
| `sources` | yes | non-empty list of free text: a URL, `user`, or `LLM:<model>` |
| `confidence` | no | `low`, `medium` or `high`; use `low` for unchecked LLM content |
| `slot` | no | groups decisions in the diagram |

`parent`, `requires`, `excludes` and `compatible_with` are not allowed in the frontmatter: the build fails if it finds them.

## Links file

`graph/links.jsonl` holds every link, one JSON object per line:

```
{"from":"861c9946","to":"b3a8fe22","type":"parent","src":"user","hint":"CoreXY > Gantry geometry"}
```

| Field | Notes |
| --- | --- |
| `from`, `to` | node ids; `parent` goes from the child to its parent |
| `type` | `parent` (a node may have several; exactly one `root`, every node must reach it, no cycles), `requires` (the target must also be selected), `excludes` (cannot be selected together, symmetric in the output), `compatible_with` (informational) |
| `src` | who or what made the link: free text, like node `sources` (`user`, `LLM:<model>`, ...) |
| `hint` | titles for people reading `git diff`; written by the tool, ignored by the build |

Canonical form: lines sorted by `type`, `from`, `to`, keys in the order above, compact JSON, no duplicate (`type`, `from`, `to`). The build accepts any valid order; `tools/graph.py format` restores it. Don't edit the file by hand: use the tool below, so every change is one readable line in `git diff`.

`graph.json` gives each node `parents` (in file order) and `children` (by title); `parent` is the first parent, which the viewer uses.

## Editing the graph

`tools/graph.py` (Python 3, standard library only) is the one way to edit nodes and links. Python is only needed to edit the graph, not to build or view it. Nodes are given by id or by a unique prefix of it.

```sh
python3 tools/graph.py new "Rack and pinion" --parent b3a8 --source "LLM:sonnet-5.5" --confidence low
python3 tools/graph.py link <new id> --requires e67a --src "LLM:sonnet-5.5"
python3 tools/graph.py link <new id> --parent f196        # a second parent
python3 tools/graph.py unlink <new id> --parent f196
python3 tools/graph.py tree     # indented outline, repeats marked
python3 tools/graph.py lint     # prints findings, exit 1 if any, writes nothing
python3 tools/graph.py format   # rewrite links.jsonl canonically, refresh hints
```

`new` prints the id and writes `graph/rack-and-pinion.md` (body empty, to be written) and its `parent` links. `link` refuses duplicates and parent cycles. `lint` reports redundant parent links (already implied through another parent), nodes without a parent, `requires` together with `excludes` on the same pair, and stale hints (run `format` after renaming a node). The build is still the full validator: run `npm run build` after editing. Tests: `python3 -m unittest discover tools`.

## Build

```sh
npm install
npm run build   # graph/ -> graph.json
npm test
```

The build prints every error and writes nothing if validation fails.

## Viewer

A static page (plain HTML and ES modules, no build step) to browse the graph and try combinations of options.

```sh
npm run build   # refresh graph.json
npm run serve   # prints http://localhost:8080/viewer/ (pass a port: npm run serve -- 9000)
```

Two pages and a **selection tray** under the header on both (one chip per chosen option with a remove `×`, counts of undecided decisions and problems, **Reset**):

- **Design** (default): a generated Mermaid block diagram of the selection (decisions grouped by `slot`, each box showing the chosen option or "undecided", solid `requires` edges, red dashed `excludes`, dotted `needs <option>` for missing requirements; click a box to open the decision), then the brief or prompt box, conflicts, required-but-unselected options, undecided decisions and the chosen options with their text. The diagram loads Mermaid from a CDN; offline it shows its source as text and the rest of the page is unaffected.
- **Graph**: an outline centred on the open node (the root when none), with the open node in the main pane beside it. Ancestors are listed above as a mirrored tree ("Why", the first parent closest), descendants below ("How"). A node reached by several paths is repeated, with its relatives listed only the first time. The outline shows 3 levels up and 2 down; a `+N more` line at the cut keeps the node open and adds two levels. Chosen options are marked ✓, and each line has badges for its `requires`, `excludes` and `compatible with` links.

Node detail is a **drawer** beside the Design page (Esc or `×` closes it) and the main pane on Graph. It shows the text, sources and `requires`/`excludes`/`compatible_with` links. An option has a select/remove button; a decision lists its options with Choose buttons and shows options excluded by the selection as disabled, naming the cause. The title in the header goes home (`#/design`, empty selection).

The page, the selection and the open node live in the URL hash, independently, so reload, sharing and the back button work:

- `#/design?pick=<id>,<id>&view=<id>`, e.g. `#/design?pick=861c9946,e67a2f12&view=18f0f7e8`
- `#/graph?pick=<id>&view=<id>&up=<0-20>&down=<0-20>`, e.g. `#/graph?view=4fa10308&down=4` (outline depths, defaults 3 and 2, dropped when another node is opened). Old forms still work: `#/selection` is Design, `#/browse[/<node-id>]` is Graph (with `view=<node-id>`).

An optional `slot` field on a node (a non-empty string, e.g. `slot: Motion`) groups decisions into labelled areas of the diagram; decisions without one go to "Other".

Unknown ids in the hash are ignored with a notice.

## Briefs

The viewer makes no LLM calls. A written brief for a selection comes from an AI outside the page:

1. Open the Design page for a combination, expand "Prompt for an AI brief" and press "Copy prompt".
2. Paste it into any AI and save its answer as a Markdown file, e.g. `brief.md`.
3. Store it: `npm run brief -- save 861c9946,e67a2f12 brief.md --model <model name>`.

Reload the page: the brief is shown above the summary with the model name.

Cache layout: `briefs/<key>.md` (frontmatter `pick`, `content_hash`, `model`, `prompt_version`, `created`, then the Markdown) and `briefs/index.json` mapping each selection key to its file. The key does not depend on the order of the ids. Saving again for the same selection replaces the brief. The prompt template is `prompts/brief.md`.

A brief is marked **stale** when the title, body, sources, `requires` or `excludes` of a selected node changed after it was saved. The prompt box is then shown again so a new brief can be made. Changes to unrelated nodes do not matter.
