# Spec Delta

## MODIFIED Requirements

### Requirement: Views and routes
The hash SHALL encode view state only: the open node (`view`), the collapsed lines (`fold`) and the peeked solutions (`peek`). It SHALL NOT encode the design. Old links SHALL still open the page: `#/design`, `#/graph` and `#/selection` as the page, `#/browse` and `#/browse/<id>` with `view=<id>` for the latter (root meaning none). A `pick` parameter SHALL be ignored with a visible notice saying that choices now live in the design. Unknown node ids SHALL be ignored with a visible notice.

#### Scenario: Default
- **WHEN** the viewer is opened without a hash
- **THEN** the page is shown with the stored design and no node open

#### Scenario: Old links
- **WHEN** the hash is `#/browse/<CoreXY id>`
- **THEN** the page is shown with `CoreXY` open in the node panel

#### Scenario: Old pick link
- **WHEN** the hash has `pick=<CoreXY id>`
- **THEN** the design is unchanged and a notice explains that `pick` links are no longer read

#### Scenario: Reload keeps state
- **GIVEN** `GT2 belt drive` open and `Lift and lower the pen` collapsed
- **WHEN** the page is reloaded
- **THEN** the same node is open and the same line is collapsed

### Requirement: Design page layout
With no node open, the node panel SHALL show the design overview: the design name and intent (editable), a line of counts (decided, undecided, problems), the brief area (existing behaviour), the conflicts and missing requirements each linking to the nodes involved, the decided functions with their choice, the undecided functions, and the buttons Export, Import, New design and Undo. With an empty design it SHALL show a hint to open a node in the graph and choose there.

#### Scenario: Empty selection
- **WHEN** nothing is decided
- **THEN** the overview shows 0 decided, the hint, and the buttons

#### Scenario: Order
- **WHEN** `CoreXY` and `Leadscrew drive` are chosen
- **THEN** the name and counts come first, then the brief area, then the conflict list

#### Scenario: Counts
- **WHEN** only `CoreXY` is chosen
- **THEN** the counts show 1 decided, the other active functions with solutions as undecided, and 1 problem

#### Scenario: Reset
- **GIVEN** a design with choices
- **WHEN** the user presses New design in the overview
- **THEN** the design is empty with a fresh id, the open node is unchanged, and Undo brings the previous design back

#### Scenario: Back to the overview
- **GIVEN** a node is open
- **WHEN** the user closes the node panel or presses Esc
- **THEN** the overview is shown and the design is unchanged

### Requirement: Narrow screens
On a narrow screen the graph panel and the node panel SHALL stack, with the node panel first when a node is open, and the edit buttons SHALL wrap. Nothing except code blocks SHALL scroll horizontally in the page body.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the page body does not scroll horizontally and the panels are stacked

### Requirement: Single page shell
The viewer SHALL be one full-width page with no tabs and no top bar: a left panel showing the graph and a right panel, full height, showing the open node or the design overview. There SHALL be no modal. The left panel SHALL take about 40% of the width. Each panel SHALL scroll on its own; the graph panel SHALL keep its scroll position when the design or the open node changes, and the node panel SHALL scroll to the top when a different node is opened.

#### Scenario: Both panels visible
- **WHEN** the viewer is opened
- **THEN** the graph is on the left and the overview on the right, and there is no bar above them

#### Scenario: Scroll kept
- **GIVEN** the graph panel is scrolled down
- **WHEN** the user chooses a solution in the node panel
- **THEN** the graph panel stays at the same scroll position

## ADDED Requirements

### Requirement: Node panel content
The node panel SHALL show, in order: the breadcrumb, the node's type icon, title, type, confidence and id, body as Markdown and sources, context (why; for a solution the other solutions of its function), implications (what it brings, requires, excludes, what constrains it), its status in the design, a what-if preview when not in the design, then the edit buttons. Every node named SHALL be a link that opens it.

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

### Requirement: Breadcrumb path
The breadcrumb SHALL follow the why-path through active functions and chosen solutions when one exists, and otherwise the first why at each step.

#### Scenario: Shared function
- **GIVEN** `Single-rail cantilever` is chosen
- **WHEN** the user opens `Transmit motor motion`
- **THEN** the breadcrumb goes through `Move the pen in XY › Single-rail cantilever`

### Requirement: Status in the design
For a function the panel SHALL show its status, choice, shortlist, rejected solutions with their reasons and notes, and list its solutions each with its state (chosen, shortlisted, rejected, excluded by, required by, open) and buttons. For a solution it SHALL show its state under its function, with the reason when excluded, required or rejected. For a constraint it SHALL show its value in the design.

#### Scenario: Excluded reason
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user opens `Leadscrew drive`
- **THEN** the panel says it is excluded by `CoreXY`

#### Scenario: Rejected reason
- **GIVEN** `Solenoid pen lift` was rejected with reason "too loud"
- **WHEN** the user opens it
- **THEN** the panel shows rejected and "too loud"

### Requirement: Edit buttons
The node panel SHALL be the only place that edits the design (besides the overview's name, intent and file buttons). For a solution it SHALL offer Choose or Unchoose, Shortlist or Unshortlist, Reject (asking for a reason in the panel) or Unreject; for a function a notes field and the same buttons per listed solution; for a constraint a value field. An Undo button SHALL be available whenever there is something to undo.

#### Scenario: Choose from the solution
- **WHEN** the user opens `CoreXY` and presses Choose
- **THEN** `CoreXY` is the choice of `Move the pen in XY` and the graph shows its chip as chosen

#### Scenario: Choose from the function
- **WHEN** the user opens `Move the pen in XY` and presses Choose next to `CoreXY`
- **THEN** `CoreXY` is chosen

#### Scenario: Reject with a reason
- **WHEN** the user presses Reject on `Solenoid pen lift`, types "too loud" and confirms
- **THEN** it is rejected with that reason

#### Scenario: Constraint value
- **WHEN** the user opens `Paper format` and enters "A4, sometimes A3"
- **THEN** the design stores that value for the constraint

### Requirement: What-if preview
For a solution that is not chosen, the panel SHALL show what choosing it would change: the current choice it would replace, the functions that would become active or inactive, the requirements it would add that are not chosen, and the chosen solutions it would conflict with. For an inactive function it SHALL name the solution choices that would make it active. The preview SHALL NOT change the design.

#### Scenario: Preview a replacement
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user opens `Cartesian, two Y rails`
- **THEN** the preview says it would replace `CoreXY`, activate `Keep the gantry square`, and drop the requirement on `GT2 belt drive`

#### Scenario: Preview a conflict
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user opens `Leadscrew drive`
- **THEN** the preview says it would conflict with `CoreXY`

## REMOVED Requirements

### Requirement: Click to choose options
**Reason**: Navigation never edits the design; clicking in the graph only opens a node.
**Migration**: Choose, Shortlist and Reject from the node panel (see Edit buttons).

### Requirement: Node modal
**Reason**: The node view moves into the full-height right panel.
**Migration**: See Node panel content; Esc or the close button return to the design overview.
