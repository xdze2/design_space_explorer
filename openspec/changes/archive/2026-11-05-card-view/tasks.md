# Tasks

## 1. Graph format and build

- [x] 1.1 In `scripts/build-graph.mjs`, accept and validate `summary` (one line, ≤120 chars) and `abbr` (1–4 letters/digits), and copy both to `graph.json`; add tests in `test/build-graph.test.mjs` for valid, multi-line, too long and `GT-2` cases, and verify `npm test` passes
- [x] 1.2 Add the `fares` link type: solution/component → constraint only, required `score` in {−2, −1, 1, 2}, `score` refused on other types, `fares: [{id, score}]` sorted by id on the source node; add tests for bad pairs, missing/0/3/1.5 scores and the output shape, and verify `npm test` passes
- [x] 1.3 List `graph/img/`: fail on files not named `<existing id>.svg` or over 50 kB, and set `img: true` on nodes with a picture; add tests (unknown id, `.png`, missing folder) and verify `npm test` passes
- [x] 1.4 Update the README node format and links file sections (new fields, `fares` and `score`, key order, `graph/img/` and the picture style from design.md), and check the documented example lines against the build

## 2. Graph tool

- [x] 2.1 In `tools/graph.py`, add `link/unlink --fares` with `--score` (required for `link`, rescoring an existing link), `score` in the canonical key order, and `fares` in the allowed pairs; add tests in `tools/test_graph.py` for add, rescore, missing score and score 0, and verify `python3 -m unittest tools/test_graph.py` passes
- [x] 2.2 Add `new --summary` with the line-break and length checks, and a lint finding for solutions and components with no `summary`; add tests and verify they pass
- [x] 2.3 Update the README "Editing the graph" examples with `--fares … --score` and `--summary`

## 3. Card component

- [x] 3.1 Create `viewer/card.js` with `abbreviation(title)` and `tile(node)`; unit-test `NEMA 17 steppers` → `N17S`, `Linear rails and bearing blocks` → `LRBB`, `CoreXY` → `CO` and the `abbr` override in `test/viewer.test.mjs`, and verify `npm test` passes
- [x] 3.2 Add `card(graph, node, opts)`: an `<img alt="">` (with `onerror` falling back to the tile) or the tile, a title link, the summary, badges sorted by score then title (`++ − ` marks, good/bad class, `title` in words, a link to the constraint) and optional state and controls slots; test the badge order and marks, and verify `npm test` passes
- [x] 3.3 Add card and grid CSS in `viewer/style.css`: `repeat(auto-fill, minmax(16rem, 1fr))`, a 6rem × 4.5rem light grey picture box, chosen/rejected/excluded state styles reusing the old `ul.options` colours, and one column at about 400px; check in the browser at desktop and phone width that the body does not scroll horizontally

## 4. Node panel

- [x] 4.1 In `viewer/views/node.js`, replace a function's `ul.options` list with a `div.cards` grid of cards carrying state text and `solutionControls()`, then remove the dead `ul.options` CSS; verify in the browser that Choose, Shortlist and Reject (with a reason) still work from a card
- [x] 4.2 Show a card header (picture or tile, summary, badges) under the title of a solution or component, and the summary for other node types; move the body and sources into `<details>`, collapsed when there is a summary and open otherwise; verify both cases in the browser
- [x] 4.3 In a constraint's status section, list the solutions that fare on it, grouped as doing well and doing badly; verify on `Budget` in the browser
- [x] 4.4 Update the README viewer section to describe the cards and the "Details" disclosure, leaving the screenshots as they are

## 5. Demo graph content

- [x] 5.1 Write a `summary` (and `abbr` where the derived one is poor) on all 37 solutions and components (33 solutions, 4 components), then verify `python3 tools/graph.py lint` reports no missing summary
- [x] 5.2 Add 1–4 `fares` links per solution with the tool (`--src LLM:claude-opus-5-5`), scored against its siblings and each backed by a sentence in the body; verify `npm run build` passes and spot-check that `Leadscrew drive` fares negatively on `Drawing speed`
- [x] 5.3 Draw the pilot SVGs for the solutions of "Move the pen in XY" in `graph/img/<id>.svg`, in the shared style (`viewBox 0 0 120 90`, stroke `#555` width 2, no `<text>`); verify with `grep -L viewBox` / `grep -l '<text'` and by viewing the function's cards in the browser

## 6. Integration check

- [x] 6.1 Run `npm run build`, `npm test`, `python3 -m unittest tools/test_graph.py` and `python3 tools/graph.py lint`, all clean; open the viewer, go through "Move the pen in XY" → `CoreXY` → `Budget`, and confirm cards, pictures, tiles, badges and the disclosure behave as the specs say
