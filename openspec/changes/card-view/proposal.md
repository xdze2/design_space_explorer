# Proposal

## Why

With 55 nodes, the node panel is mostly prose: comparing the alternatives under a function means opening each solution and reading paragraphs. A McMaster-Carr-style catalog (picture, title, one line, a few key facts per card) lets a reader scan and compare options at a glance, with the prose one click away.

## What Changes

- New optional frontmatter fields: `summary` (one line saying what the node is) and `abbr` (a short label for the picture tile).
- New link type `fares` from a solution or component to a constraint, with a required integer `score` from -2 to +2 (not 0): how the solution does against that constraint. It replaces nothing; constraint prose stays.
- Optional picture per node: a monochrome SVG at `graph/img/<id>.svg`. The build checks the file names and records which nodes have one. When a node has no picture, the card shows an automatic abbreviation tile (`GT2`, `N17S`) or the `abbr` override.
- The viewer shows a function's solutions as a grid of cards: picture or tile, title, summary, tradeoff badges (`++ Drawing speed`, `− Budget`), state in the design (chosen, shortlisted, excluded...) and the Choose / Shortlist / Reject buttons.
- A solution's node panel opens with the same card header (picture, summary, badges). The prose body moves into a collapsed "Details" disclosure.
- `tools/graph.py`: `link --fares <constraint> --score N`, `new --summary`, and a lint finding for solutions without a summary.
- Demo graph: a summary on every solution and component, `fares` links for the solutions, and pilot SVG pictures for the solutions of "Move the pen in XY".

Out of scope:
- Icon sets, hash-based identicons, photos, and image generation at runtime or at build time. Pictures are hand- or LLM-made files committed to the repo.
- Changing the left graph panel (chips stay chips).
- Filtering or sorting by constraint score, and score totals in the design overview. Both are natural follow-ups once `fares` data exists.
- Cards in the design overview.

## Capabilities

### New Capabilities
- `solution-cards`: how a solution or component is shown as a card: picture or abbreviation tile, summary, tradeoff badges, state and actions.

### Modified Capabilities
- `knowledge-graph-format`: the `summary` and `abbr` fields, the `fares` link type with `score`, pictures under `graph/img/`, and the new data in `graph.json`.
- `design-page`: a function's solutions are shown as cards; a solution's panel starts with a card header and puts the body in a collapsed disclosure.
- `graph-tool`: `--fares` with `--score`, `new --summary`, and a missing-summary lint finding.
- `pen-plotter-demo-graph`: summaries, `fares` links and pilot pictures.

## Impact

- `scripts/build-graph.mjs` and its tests: new fields, link type, score validation, picture check.
- `tools/graph.py`: new options and a lint rule.
- `viewer/views/node.js`, a new `viewer/card.js`, `viewer/style.css`, viewer tests.
- `graph/*.md`, `graph/links.jsonl`, new `graph/img/`, `graph.json`.
- `README.md`: node format, links file and viewer sections. The screenshots are left as they are.
