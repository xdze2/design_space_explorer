## 1. Already done (single page shell)

- [x] 1.1 One-page shell: top bar, graph panel, main panel, modal; tabs and Graph page removed
- [x] 1.2 `tree.js` columns layout with SVG tree and cross links; top bar pills; `hash.js` without page and depths; Mermaid and `diagram.js` removed
- [x] 1.3 Tests for hash and `tree.js`

## 2. Outline layout and layout switch

- [x] 2.1 `outline.js`: preorder rows `{ id, depth, repeat }` from the root, repeats marked, with tests
- [x] 2.2 `hash.js`: `layout` parameter (`columns` default, `outline`, anything else falls back), with tests
- [x] 2.3 `views/graph.js`: switch control and outline rendering sharing the row state classes
- [x] 2.4 CSS for the outline rows and the switch

## 3. Row actions

- [x] 3.1 Option row click toggles selection (not for excluded unchosen options); decision and root click open the modal
- [x] 3.2 `(?)` icon on every row in both layouts opens the modal; dot becomes display only
- [x] 3.3 CSS for the `(?)` icon and disabled rows

## 4. Wrap up

- [x] 4.1 Check both layouts in the browser at wide and narrow widths
- [x] 4.2 Update README viewer section (no tabs, layouts, click and `(?)`), run `npm test`

## 5. Aligned outline (replaces the columns layout and the switch)

- [x] 5.1 Remove `tree.js`, its tests, the layout switch and the `layout` hash parameter (old `layout=` ignored)
- [x] 5.2 `views/graph.js`: one outline of fixed-height rows with lanes `name | tags | link lane | ?`
- [x] 5.3 State tags lane: chosen, excluded by X, undecided, needs, conflict
- [x] 5.4 SVG link lane: curves between rows, arrow / dashed / dotted by type, emphasis on open or hovered row
- [x] 5.5 CSS, README and tests updated; check in the browser at wide and narrow widths
