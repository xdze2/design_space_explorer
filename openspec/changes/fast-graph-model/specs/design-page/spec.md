## MODIFIED Requirements

### Requirement: Design page layout
The main view SHALL start with a small header showing the number of picked solutions, undecided decisions (functions whose how-targets are solutions) and problems (conflicts and missing requirements), and a Reset button, shown only when something is selected, that clears the selection and keeps the open node. Below the header it SHALL show, in order: the cached brief or the prompt box (existing behaviour), the conflicts, the required-but-not-selected nodes with a select action, the chosen solutions with their bodies and sources, and the undecided decisions. With an empty selection it SHALL show a hint to start choosing in the graph.

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the main view says so and points to the graph, the header shows 0 picked, and no Reset button

#### Scenario: Order
- **WHEN** `gantry/corexy` and `drive/leadscrew` are selected
- **THEN** the header comes first, then the brief area, then the conflict list

#### Scenario: Counts
- **WHEN** only `gantry/corexy` is selected
- **THEN** the header shows 1 picked, the other decisions as undecided, and 1 problem

#### Scenario: Reset
- **GIVEN** solutions are selected
- **WHEN** the user presses Reset in the header
- **THEN** the selection is empty and the open node is unchanged

### Requirement: Narrow screens
On a narrow screen the graph panel and the main view SHALL stack, the main view header SHALL wrap, and the modal SHALL fit the screen width. Nothing except code blocks SHALL scroll horizontally in the page body.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the page body does not scroll horizontally and the panels are stacked

### Requirement: Single page shell
The viewer SHALL be one full-width page with no tabs and no top bar: a left panel showing the graph, a right panel showing the main view for the selection, and the node view in a modal over the page. The left panel SHALL take about 40% of the width. Each panel SHALL scroll on its own and keep its scroll position when the selection or the open node changes.

#### Scenario: Both panels visible
- **WHEN** the viewer is opened
- **THEN** the graph is on the left and the main view on the right, and there is no bar above them

#### Scenario: Scroll kept
- **GIVEN** the main view is scrolled down
- **WHEN** the user selects a solution
- **THEN** the main view stays at the same scroll position

### Requirement: Click to choose options
Clicking a solution's line in the graph SHALL toggle its selection, with at most one solution per decision. A solution excluded by the current selection and not chosen SHALL NOT toggle and SHALL be shown disabled, with the selected solution responsible named. A chosen solution SHALL always be removable. A solution SHALL also be chosen or unchosen from its own node view and from its decision's node view, which lists its solutions with a choose action each. Functions, constraints and components SHALL have no selection toggle.

#### Scenario: Click to choose
- **WHEN** the user clicks the `CoreXY` line
- **THEN** `gantry/corexy` is selected and its line is marked chosen

#### Scenario: One per decision
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user clicks the `H-bot` line
- **THEN** `gantry/h-bot` replaces `gantry/corexy`

#### Scenario: Excluded option
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user clicks the `Leadscrew` line
- **THEN** the selection is unchanged and the line shows `CoreXY` as the cause

#### Scenario: Choose from the decision
- **WHEN** the user opens the gantry function and chooses `CoreXY`
- **THEN** `gantry/corexy` is selected

### Requirement: Node modal
The node view SHALL open as a modal over the page, which stays rendered underneath. It SHALL open from the `(?)` icon of any line in the graph, from a function or constraint line, and from links in the main view. It SHALL show title, type, confidence, body as Markdown, sources, links for `why` and `how`, for `constrains` and `constrained_by`, and for `requires`, `excludes` and `compatible_with`, and for a solution the choose action. Following an edge link SHALL show that node in the same modal. Esc, the close button or a click outside the dialog SHALL close it without changing the selection.

#### Scenario: Open from the icon
- **WHEN** the user clicks the `(?)` of the `Leadscrew` line
- **THEN** a modal shows `drive/leadscrew` and the selection is unchanged

#### Scenario: Why and how links
- **WHEN** a solution with a sub-function is opened
- **THEN** the modal links to the function it answers (why) and to the sub-function (how)

#### Scenario: Close
- **WHEN** the user presses Esc, the × or the backdrop
- **THEN** the modal closes and the selection is unchanged

#### Scenario: Follow an edge
- **GIVEN** `gantry/corexy` is shown
- **WHEN** the user follows the `drive/gt2-belt` link
- **THEN** `drive/gt2-belt` is shown in the same modal

## REMOVED Requirements

### Requirement: Top bar
**Reason**: The top bar is dropped. Its selection counts and Reset move into a small header at the top of the main view. Pills and groups are not replaced; a breadcrumb for the open node is planned for the next change, `design-document`.
**Migration**: None. Use the graph outline and the main view header.
