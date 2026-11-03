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

Two pages:

- **Selection**: a panel on the left (toggle an option, `i` opens its detail, **Reset** clears the selection) and the current selection with each chosen option's text, plus conflicts, required-but-unselected options and undecided decisions.
- **Browse**: a full-width overview of the whole graph as an expanded tree, chosen options marked. No panel.

Node detail opens in a **modal** over the current page (Esc, the close button or a click outside closes it). It shows the text, sources and `requires`/`excludes`/`compatible_with` links, plus a select/remove button for options. The title in the header goes home (`#/selection`, empty selection).

The page, the selection and the open node live in the URL hash, independently, so reload, sharing and the back button work:

- `#/selection?pick=<id>,<id>&view=<id>`, e.g. `#/selection?pick=gantry/corexy,drive/gt2-belt&view=drive/leadscrew`
- `#/browse?pick=<id>&view=<id>`; the old form `#/browse/<node-id>` is read as Browse with `view=<node-id>`.

Unknown ids in the hash are ignored with a notice.

## Briefs

The viewer makes no LLM calls. A written brief for a selection comes from an AI outside the page:

1. Open the Selection page for a combination, expand "Prompt for an AI brief" and press "Copy prompt".
2. Paste it into any AI and save its answer as a Markdown file, e.g. `brief.md`.
3. Store it: `npm run brief -- save gantry/corexy,drive/gt2-belt brief.md --model <model name>`.

Reload the page: the brief is shown above the summary with the model name.

Cache layout: `briefs/<key>.md` (frontmatter `pick`, `content_hash`, `model`, `prompt_version`, `created`, then the Markdown) and `briefs/index.json` mapping each selection key to its file. The key does not depend on the order of the ids. Saving again for the same selection replaces the brief. The prompt template is `prompts/brief.md`.

A brief is marked **stale** when the title, body, sources, `requires` or `excludes` of a selected node changed after it was saved. The prompt box is then shown again so a new brief can be made. Changes to unrelated nodes do not matter.
