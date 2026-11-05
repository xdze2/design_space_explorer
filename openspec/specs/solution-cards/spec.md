# solution-cards Specification

## Purpose
Shows a solution or component as a compact, catalog-style card (picture or abbreviation tile, title, one-line summary, tradeoff badges, state in the design) so alternatives can be compared at a glance without reading their prose.

## Requirements

### Requirement: Card content
A card SHALL show, in order: the picture or abbreviation tile, the title (a link that opens the node), the summary when the node has one, the tradeoff badges, and the node's state in the design. It SHALL NOT show the node body.

#### Scenario: Full card
- **GIVEN** `CoreXY` has a picture, a summary and two `fares` links
- **WHEN** its card is shown
- **THEN** the card shows the picture, `CoreXY`, the summary, two badges and its state

#### Scenario: Bare card
- **GIVEN** a solution with no picture, no summary and no `fares` link
- **WHEN** its card is shown
- **THEN** the card shows an abbreviation tile, the title and its state, and no empty summary or badge row

### Requirement: Picture or tile
A card SHALL show the node's picture when the graph says it has one, with an empty `alt` because the title is next to it. Otherwise it SHALL show a tile with the node's `abbr` when set, or else an abbreviation derived from the title: the initials of up to four words (skipping `a`, `an`, `and`, `the`, `of`, `on`, `over`, `to`, `with`), with words that contain a digit kept whole, uppercase, cut to 4 characters. A one-word title SHALL give its first two letters.

#### Scenario: Derived abbreviation
- **WHEN** solutions titled `NEMA 17 steppers`, `Linear rails and bearing blocks` and `CoreXY` have no picture and no `abbr`
- **THEN** their tiles show `N17S`, `LRBB` and `CO`

#### Scenario: Override
- **GIVEN** `GT2 belt drive` has `abbr: GT2`
- **WHEN** its card is shown without a picture
- **THEN** the tile shows `GT2`

#### Scenario: Missing picture file
- **GIVEN** the graph says a node has a picture but the file fails to load
- **WHEN** its card is shown
- **THEN** the tile is shown instead of a broken image

### Requirement: Tradeoff badges
A card SHALL show one badge per `fares` link of the node, ordered by score from best to worst and then by constraint title. A badge SHALL read as the score marks then the constraint title: `++` for +2, `+` for +1, `−` for −1, `−−` for −2, styled as good or bad. Each badge SHALL link to the constraint, and its title SHALL state the score in words.

#### Scenario: Order and marks
- **GIVEN** `CoreXY` fares +2 on `Drawing speed` and −1 on `Budget`
- **WHEN** its card is shown
- **THEN** the badges read `++ Drawing speed` (good) then `− Budget` (bad)

### Requirement: Card state
A card under a function SHALL show the solution's state under that function (chosen, shortlisted, rejected with its reason, excluded by, required by, open) with the same names as the graph chips, and SHALL be styled by that state: chosen highlighted, rejected and excluded dimmed.

#### Scenario: Excluded card
- **GIVEN** `CoreXY` is chosen
- **WHEN** the cards of `Transmit motor motion` are shown
- **THEN** the `Leadscrew drive` card is dimmed and says excluded by `CoreXY`

### Requirement: Card grid
Cards SHALL be laid out in a grid that fills the panel width with cards about 16rem wide, in the function's `how` order, and SHALL fall back to one column on a narrow screen without horizontal scrolling.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the cards are stacked in one column and the page body does not scroll horizontally
