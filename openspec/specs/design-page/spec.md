# design-page Specification

## Purpose
Gives the viewer one full-width page: a top bar summarizing the selection, a graph panel on the left, the main view of the selection on the right, and the node view as a modal.

## Requirements

### Requirement: Views and routes
The hash SHALL encode the selection (`pick`), the open node (`view`) independently. Old links SHALL still open the page: `#/design`, `#/graph` and `#/selection` as the page, `#/browse` and `#/browse/<id>` with `view=<id>` for the latter (root meaning none). Unknown node ids SHALL be ignored with a visible notice.

#### Scenario: Default
- **WHEN** the viewer is opened without a hash
- **THEN** the page is shown with an empty selection and no node open

#### Scenario: Old links
- **WHEN** the hash is `#/browse/gantry/corexy`
- **THEN** the page is shown with `gantry/corexy` open in the modal

#### Scenario: Reload keeps state
- **GIVEN** `gantry/corexy` selected and `drive/gt2-belt` open
- **WHEN** the page is reloaded
- **THEN** the same selection and open node are shown

### Requirement: Design page layout
The main view SHALL show, in order: the cached brief or the prompt box (existing behaviour), the conflicts, the required-but-not-selected nodes with a select action, the chosen options with their bodies and sources, and the undecided decisions. With an empty selection it SHALL show a hint to start choosing in the graph.

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the main view says so and points to the graph

#### Scenario: Order
- **WHEN** `gantry/corexy` and `drive/leadscrew` are selected
- **THEN** the brief area comes first, then the conflict list

### Requirement: Narrow screens
On a narrow screen the top bar SHALL wrap, the graph panel and the main view SHALL stack, and the modal SHALL fit the screen width. Nothing except code blocks SHALL scroll horizontally in the page body.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the page body does not scroll horizontally and the panels are stacked

### Requirement: Single page shell
The viewer SHALL be one full-width page with no tabs: a top bar, a left panel showing the graph, a right panel showing the main view for the selection, and the node view in a modal over the page. The left panel SHALL take about 40% of the width. Each panel SHALL scroll on its own and keep its scroll position when the selection or the open node changes.

#### Scenario: Both panels visible
- **WHEN** the viewer is opened
- **THEN** the graph is on the left and the main view on the right, with the top bar above both

#### Scenario: Scroll kept
- **GIVEN** the main view is scrolled down
- **WHEN** the user selects an option
- **THEN** the main view stays at the same scroll position

### Requirement: Top bar
The top bar SHALL show the decisions grouped by `slot` (decisions without a slot in an `Other` group, last, omitted when empty), one pill per decision with its title and its chosen option or `?` when undecided (dashed). A pill SHALL be marked when its chosen option conflicts with another or requires an unselected node. Activating a pill SHALL open that decision in the node view. The bar SHALL also show the number of picked options, undecided decisions and problems (conflicts and missing requirements), and a Reset button, shown only when something is selected, that clears the selection and keeps the open node.

#### Scenario: Slots as groups
- **WHEN** the page is shown
- **THEN** `Motion` groups the gantry, drive and linear guide pills, `Tool` the pen lift, `Electronics` the controller

#### Scenario: Decided and undecided
- **WHEN** only `gantry/corexy` is selected
- **THEN** the gantry pill shows `CoreXY` and the other four pills show `?`

#### Scenario: Counts
- **WHEN** only `gantry/corexy` is selected
- **THEN** the bar shows 1 picked, 4 undecided and 1 problem

#### Scenario: Reset
- **GIVEN** options are selected
- **WHEN** the user presses Reset
- **THEN** the selection is empty

### Requirement: Click to choose options
Clicking an option's line in the graph SHALL toggle its selection, with at most one option per decision. An option excluded by the current selection and not chosen SHALL NOT toggle and SHALL be shown disabled, with the selected option responsible named. A chosen option SHALL always be removable. An option SHALL also be chosen or unchosen from its own node view and from its decision's node view, which lists its options with a choose action each. Decisions and the root SHALL have no selection toggle.

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
- **WHEN** the user opens `gantry` and chooses `CoreXY`
- **THEN** `gantry/corexy` is selected

### Requirement: Node modal
The node view SHALL open as a modal over the page, which stays rendered underneath. It SHALL open from the `(?)` icon of any line in the graph, from a top-bar pill, from a decision line, and from links in the main view. It SHALL show title, type, confidence, body as Markdown, sources, links for `requires`, `excludes` and `compatible_with`, and for an option the choose action. Following an edge link SHALL show that node in the same modal. Esc, the close button or a click outside the dialog SHALL close it without changing the selection.

#### Scenario: Open from the icon
- **WHEN** the user clicks the `(?)` of the `Leadscrew` line
- **THEN** a modal shows `drive/leadscrew` and the selection is unchanged

#### Scenario: Close
- **WHEN** the user presses Esc, the × or the backdrop
- **THEN** the modal closes and the selection is unchanged

#### Scenario: Follow an edge
- **GIVEN** `gantry/corexy` is shown
- **WHEN** the user follows the `drive/gt2-belt` link
- **THEN** `drive/gt2-belt` is shown in the same modal
