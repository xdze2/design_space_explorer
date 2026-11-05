# Design

## Context

See proposal.md for the motivation. Current state:

- The viewer is plain ES modules with no build step. It loads `../graph.json` and is served from the repo root by `scripts/serve.mjs`, so `../graph/img/<id>.svg` is reachable as is.
- In the node panel ([viewer/views/node.js](../../../viewer/views/node.js)), a function lists its solutions as `ul.options` rows: link, state text and `solutionControls()`. Rendering the body is `renderMarkdown` into `innerHTML`, followed by sources.
- The CSS has a light theme only, with tokens such as `--ok`, `--bad`, `--line` and `--muted`.
- The demo graph has 7 constraint nodes (Budget, Drawing speed, Line quality, Paper format, Drawing media, Drawing tool, Repeatability) and 37 solutions and components.

## Goals / Non-Goals

**Goals:**
- One card component, used both in the function's grid and as the header of a solution's panel.
- A fixed tradeoff vocabulary: badges can only name constraint nodes.
- Every card looks finished with zero pictures.

**Non-Goals:**
- Theming or dark mode for pictures.
- Editing summaries, scores or pictures from the viewer, which stays read-only for the graph.

## Decisions

**Tradeoffs as `fares` links to constraint nodes, not free tags in frontmatter.**
Free tags like `+speed` would drift (`speed`, `fast`, `drawing speed`) and could never drive a filter. Links to constraint nodes keep one vocabulary. They also live in `links.jsonl`, so each one is a readable diff line with its own `src`, and they reuse the tool's existing link machinery: id prefixes, canonical form and hints. A frontmatter map `fares: {budget: -1}` was considered too. It would bring back the "links in frontmatter" pattern that the format removed on purpose.

**Score −2…+2 with no 0.**
Five levels can't be told apart in a badge, and three (−/+) can't express "the main reason to pick it". A neutral score is the same as no link, so 0 is rejected and the badge rows stay short. Marks are `++ + − −−`, using the typographic minus, plus a good/bad colour. The `title` attribute spells out the score ("much better on Drawing speed"), so the meaning doesn't depend on colour.

**`score` is a link field, like `order`.**
In the canonical key order it goes after `order`: `from, to, type, order, score, src, hint`. In the build it is validated next to `order`: `fares` only, an integer in {−2, −1, 1, 2}. `graph.json` gets `fares: [{id, score}]` on the source node only. Constraint panels compute the reverse list in the viewer, with a scan over 55 nodes that costs nothing.

**Pictures are optional committed SVG files named by id; `img: true` in `graph.json`.**
Naming the files by id rather than by slug keeps them stable across retitles, like the links. The build only lists `graph/img/` and checks the names and sizes. That lets the viewer avoid a 404 request for every node without a picture. The pictures are shown with `<img>`, never inlined. An SVG loaded through `<img>` cannot run script, so a picture from an LLM is safe to show unreviewed. An `onerror` handler swaps the `<img>` for the tile. Among the other image options:
- icon sets have no CoreXY or polargraph icon, and would add a dependency or vendored files;
- hash identicons carry no meaning and add visual noise;
- a single word duplicates the title.

The abbreviation tile is the zero-cost default, and `abbr` fixes the cases where the derived letters are poor.

**Picture style for the pilot set.**
`viewBox="0 0 120 90"`, `stroke="#555"`, `stroke-width="2"`, `fill="none"`, with the same grey as an optional fill for motors. There is no text, and the view is a schematic top view of the mechanism. Cards draw the picture in a 6rem × 4.5rem box on a light grey ground, like McMaster's renders. The style goes in the README so later pictures (LLM or hand-drawn) match.

**A new `viewer/card.js` module.**
It exports `card(graph, node, opts)` and `tile(node)`, plus `abbreviation(title)`, which is a pure function so it can be unit-tested. `opts` carries the chip state, the `link` function and the controls element. Under a function, `node.js` builds the controls with the existing `solutionControls()`. The solution header calls `card` without state or controls. The `ul.options` list is replaced by `div.cards`, a CSS grid with `repeat(auto-fill, minmax(16rem, 1fr))`, whose cards use the same state classes as the old rows.

**The body in `<details>`, open when there is no summary.**
Without a summary, the card header carries little, and hiding the only text would be a regression. Once the demo is fully summarised, every disclosure starts collapsed.

## Risks / Trade-offs

- [LLM scores are subjective and may contradict the prose] → Spec rule: every `fares` link must be backed by a sentence in the body. Links carry `src: LLM:<model>` and the nodes stay `confidence: low`.
- [Pictures drift in style as more are added] → The README documents the style, and the pilot set serves as the reference.
- [A score is relative to the alternatives, not absolute] → Scores are written per function, comparing siblings. The README says so. A later filter has to read them the same way.
- [`summary` duplicates the first sentence of the body] → Accepted. The summary is a catalog line and the body is the argument.

## Migration Plan

The change is additive. Old `graph.json` consumers ignore `fares` and `img`, nodes without a summary still build, and the lint rule makes the gaps visible. Rolling back means reverting the commit.
