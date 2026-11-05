# Spec Delta

## MODIFIED Requirements

### Requirement: Node panel content
The node panel SHALL show, in order: the breadcrumb, the node's type icon and title, for a solution or component a card header (picture or tile, summary, tradeoff badges), for other nodes the summary when set, the type, confidence and id, a "Details" disclosure holding the body as Markdown and the sources, context (why; for a solution the other solutions of its function), implications (what it brings, requires, excludes, what constrains it), its status in the design, a what-if preview when not in the design, then the edit buttons. The "Details" disclosure SHALL be collapsed when the node has a summary and open when it has none. Every node named SHALL be a link that opens it.

#### Scenario: Open a solution
- **WHEN** the user opens `CoreXY`
- **THEN** the panel shows the breadcrumb `Draw a design on paper with a pen › Move the pen in XY`, its body, the other gantry solutions, that it brings `Transmit motor motion` and `Guide the axes`, requires `GT2 belt drive` and excludes `Leadscrew drive`

#### Scenario: Follow a link
- **GIVEN** `CoreXY` is open
- **WHEN** the user follows the `GT2 belt drive` link
- **THEN** `GT2 belt drive` is open in the panel and the design is unchanged

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text

#### Scenario: Card header and collapsed body
- **GIVEN** `CoreXY` has a summary, a picture and `fares` links
- **WHEN** the user opens it
- **THEN** the picture, summary and badges are shown under the title and the body is hidden in a collapsed "Details" disclosure that opens on click

#### Scenario: No summary
- **GIVEN** a solution without a summary
- **WHEN** the user opens it
- **THEN** the "Details" disclosure is open

### Requirement: Status in the design
For a function the panel SHALL show its status, choice, shortlist, rejected solutions with their reasons and notes, and show its solutions as a grid of cards, each with its state (chosen, shortlisted, rejected, excluded by, required by, open) and its buttons. For a solution it SHALL show its state under its function, with the reason when excluded, required or rejected. For a constraint it SHALL show its value in the design and the solutions that fare on it, grouped as doing well (positive score) and doing badly (negative score).

#### Scenario: Excluded reason
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user opens `Leadscrew drive`
- **THEN** the panel says it is excluded by `CoreXY`

#### Scenario: Rejected reason
- **GIVEN** `Solenoid pen lift` was rejected with reason "too loud"
- **WHEN** the user opens it
- **THEN** the panel shows rejected and "too loud"

#### Scenario: Function shows cards
- **WHEN** the user opens `Move the pen in XY`
- **THEN** each of its solutions is shown as a card with its picture or tile, summary, badges, state and Choose / Shortlist / Reject buttons, in the function's `how` order

#### Scenario: Choose from a card
- **WHEN** the user presses Choose on the `CoreXY` card of `Move the pen in XY`
- **THEN** `CoreXY` is chosen and its card is shown as chosen

#### Scenario: Constraint lists how solutions fare
- **GIVEN** `CoreXY` fares −1 and `H-bot` fares +1 on `Budget`
- **WHEN** the user opens `Budget`
- **THEN** the panel lists `H-bot` as doing well and `CoreXY` as doing badly, each a link
