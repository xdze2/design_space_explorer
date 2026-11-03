# Design space explorer

An LLM-maintained wiki of design decisions, stored as a graph of Markdown nodes. First topic: a DIY A3 pen plotter.

## Layout

- `graph/`: one Markdown file per node
- `scripts/build-graph.mjs`: validates the nodes and compiles them to `graph.json`
- `graph.json`: compiled output (committed)
- `raw/`: source material (web pages, chats, notes). Git-ignored and never read by the build.

## Node format

A node is a Markdown file under `graph/` with YAML frontmatter and a free prose body. Its id is its path relative to `graph/`, without `.md` (`graph/gantry/corexy.md` is `gantry/corexy`).

```markdown
---
title: CoreXY
type: option
parent: gantry
requires: [drive/gt2-belt]
excludes: [gantry/single-rail-cantilever]
compatible_with: [controller/fluidnc]
sources: ["LLM:sonnet-5.5"]
confidence: low
---
Why it would be chosen, the tradeoffs, and why each edge above exists.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | |
| `type` | yes | `root`, `decision`, `option` or `component` |
| `sources` | yes | non-empty list of free text: a URL, `user`, or `LLM:<model>` |
| `parent` | yes, except for `root` | exactly one `root` node; every node must reach it |
| `requires` | no | nodes that must also be selected |
| `excludes` | no | nodes that cannot be selected together; symmetric in the output |
| `compatible_with` | no | informational only |
| `confidence` | no | `low`, `medium` or `high`; use `low` for unchecked LLM content |

Every id in `parent`, `requires`, `excludes` and `compatible_with` must exist.

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
- **Graph**: the whole graph as an expanded tree (chosen options marked) with the open node in the main pane beside it.

Node detail is a **drawer** beside the Design page (Esc or `×` closes it) and the main pane on Graph. It shows the text, sources and `requires`/`excludes`/`compatible_with` links. An option has a select/remove button; a decision lists its options with Choose buttons and shows options excluded by the selection as disabled, naming the cause. The title in the header goes home (`#/design`, empty selection).

The page, the selection and the open node live in the URL hash, independently, so reload, sharing and the back button work:

- `#/design?pick=<id>,<id>&view=<id>`, e.g. `#/design?pick=gantry/corexy,drive/gt2-belt&view=drive/leadscrew`
- `#/graph?pick=<id>&view=<id>`. Old forms still work: `#/selection` is Design, `#/browse[/<node-id>]` is Graph (with `view=<node-id>`).

An optional `slot` field on a node (a non-empty string, e.g. `slot: Motion`) groups decisions into labelled areas of the diagram; decisions without one go to "Other".

Unknown ids in the hash are ignored with a notice.

## Briefs

The viewer makes no LLM calls. A written brief for a selection comes from an AI outside the page:

1. Open the Design page for a combination, expand "Prompt for an AI brief" and press "Copy prompt".
2. Paste it into any AI and save its answer as a Markdown file, e.g. `brief.md`.
3. Store it: `npm run brief -- save gantry/corexy,drive/gt2-belt brief.md --model <model name>`.

Reload the page: the brief is shown above the summary with the model name.

Cache layout: `briefs/<key>.md` (frontmatter `pick`, `content_hash`, `model`, `prompt_version`, `created`, then the Markdown) and `briefs/index.json` mapping each selection key to its file. The key does not depend on the order of the ids. Saving again for the same selection replaces the brief. The prompt template is `prompts/brief.md`.

A brief is marked **stale** when the title, body, sources, `requires` or `excludes` of a selected node changed after it was saved. The prompt box is then shown again so a new brief can be made. Changes to unrelated nodes do not matter.
