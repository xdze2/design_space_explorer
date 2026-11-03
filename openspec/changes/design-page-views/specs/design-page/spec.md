# Spec Delta

## Purpose

Gives the viewer three views with separate roles (Graph, Design, Node) and a compact selection tray, and shows the current selection as a generated block diagram on top of its page.

## ADDED Requirements

### Requirement: Views and routes
The viewer SHALL have a Graph page and a Design page, and the Design page SHALL be the default. The hash SHALL encode the page, the selection (`pick`) and the open node (`view`) independently. `#/selection` SHALL be read as Design and `#/browse` and `#/browse/<id>` as Graph (with `view=<id>` for the latter, root meaning none). Unknown node ids SHALL be ignored with the existing visible notice.

#### Scenario: Default
- **WHEN** the viewer is opened without a hash
- **THEN** the Design page is shown with an empty selection

#### Scenario: Old links
- **WHEN** the hash is `#/browse/gantry/corexy`
- **THEN** the Graph page is shown with `gantry/corexy` open

#### Scenario: Reload keeps state
- **GIVEN** the Design page with `gantry/corexy` selected and `drive/gt2-belt` open
- **WHEN** the page is reloaded
- **THEN** the same page, selection and open node are shown

### Requirement: Selection tray
The viewer SHALL show a selection tray on every page instead of a side panel. The tray SHALL show one chip per chosen option (linking to its node, with a remove action), the number of undecided decisions, the number of problems (conflicts and missing requirements) and a Reset button that clears the selection and keeps the page. The tray SHALL contain no list of all options.

#### Scenario: Tray everywhere
- **WHEN** the user switches between Graph and Design
- **THEN** the same tray with the same chips is shown

#### Scenario: Remove a chip
- **GIVEN** `gantry/corexy` and `drive/gt2-belt` are selected
- **WHEN** the user removes the `CoreXY` chip
- **THEN** only `drive/gt2-belt` remains selected and the page is unchanged

#### Scenario: Counts
- **WHEN** only `gantry/corexy` is selected
- **THEN** the tray shows 4 undecided decisions and 1 problem (missing `drive/gt2-belt`)

#### Scenario: Reset
- **GIVEN** options are selected on the Graph page
- **WHEN** the user presses Reset
- **THEN** the selection is empty and the Graph page is still shown

### Requirement: Choosing options
An option SHALL be chosen or unchosen from the option's node view and from its decision's node view. A decision's node view SHALL list its options with a choose action each, at most one option per decision, and SHALL show options excluded by the current selection as disabled, naming the selected option responsible. The Graph tree SHALL mark chosen options. Decision and other non-option nodes SHALL show no choose action for themselves.

#### Scenario: Choose from the decision
- **WHEN** the user opens `gantry` and chooses `CoreXY`
- **THEN** `gantry/corexy` is selected and the tray shows its chip

#### Scenario: One per decision
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user chooses `gantry/h-bot` from the `gantry` view
- **THEN** `gantry/h-bot` replaces `gantry/corexy`

#### Scenario: Exclusion shown
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user opens `drive`
- **THEN** `Leadscrew` is shown disabled with `CoreXY` named as the cause

### Requirement: Node view placement
Opening a node on the Design page SHALL show it in a side drawer next to the page, which stays visible and unchanged. Opening a node on the Graph page SHALL show it in the main pane beside the tree, with no overlay. The node view SHALL show title, type, confidence, body as Markdown, sources, links for `requires`, `excludes` and `compatible_with`, and for an option the choose action. Following an edge link SHALL show that node in the same place. No modal SHALL be used.

#### Scenario: Drawer on Design
- **WHEN** the user activates a chip or a diagram box on the Design page
- **THEN** a drawer shows that node and the Design page stays rendered beside it

#### Scenario: Close the drawer
- **WHEN** the user presses Esc or the close button of the drawer
- **THEN** the drawer is closed and the selection is unchanged

#### Scenario: Main pane on Graph
- **WHEN** the user activates `Leadscrew` in the Graph tree
- **THEN** the main pane shows `drive/leadscrew` beside the tree and nothing overlays the page

#### Scenario: Follow an edge
- **GIVEN** `gantry/corexy` is shown
- **WHEN** the user follows the `drive/gt2-belt` link
- **THEN** `drive/gt2-belt` is shown in the same place

### Requirement: Design page layout
The Design page SHALL show, in order: the block diagram, the cached brief or the prompt box (existing behaviour), the conflicts, the required-but-not-selected nodes with a select action, the undecided decisions, and the chosen options with their bodies and sources. With an empty selection it SHALL still show the diagram, with every decision undecided.

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the diagram shows every decision as undecided and the page points to the Graph page or the diagram to start choosing

#### Scenario: Order
- **WHEN** `gantry/corexy` and `drive/leadscrew` are selected
- **THEN** the diagram comes first and the conflict list comes after the brief area

### Requirement: Block diagram
The Design page SHALL render a Mermaid block diagram generated from the graph and the selection, with no stored diagram. Each decision SHALL be one box, grouped into one labelled subgraph per `slot` (decisions without a slot in an `Other` group, omitted when empty). A decided box SHALL show the decision title and the chosen option title; an undecided box SHALL show the title and "undecided" with a dashed style. A `requires` edge between two chosen options SHALL be drawn solid between their decisions; a conflict SHALL be drawn as a distinct dashed edge labelled `excludes`; a required node that is not selected SHALL be drawn as a dotted edge to its decision labelled `needs <title>`. Activating a box SHALL open that decision in the node view. Node text SHALL be escaped so titles cannot alter the diagram or inject HTML.

#### Scenario: Slots as groups
- **WHEN** the Design page is shown
- **THEN** `Motion` contains the gantry, drive and linear guide boxes, `Tool` the pen lift, `Electronics` the controller

#### Scenario: Decided and undecided
- **WHEN** only `gantry/corexy` is selected
- **THEN** the gantry box shows `CoreXY` and the other four boxes show `undecided`

#### Scenario: Requirement edge
- **WHEN** `gantry/corexy` and `drive/gt2-belt` are selected
- **THEN** a solid edge links the gantry box to the drive box

#### Scenario: Missing requirement
- **WHEN** only `gantry/corexy` is selected
- **THEN** a dotted edge labelled `needs GT2 belt` points to the drive box

#### Scenario: Conflict edge
- **WHEN** `gantry/corexy` and `drive/leadscrew` are selected
- **THEN** a dashed `excludes` edge links the two boxes

#### Scenario: Escaping
- **WHEN** a node title contains quotes, brackets or `<script>`
- **THEN** the diagram source stays valid and the text is shown literally

### Requirement: Diagram fallback
If Mermaid cannot be loaded or rendering fails, the Design page SHALL show the diagram source as preformatted text with a short notice, and the rest of the page SHALL render normally.

#### Scenario: Offline
- **WHEN** the Mermaid script cannot be loaded
- **THEN** the source is shown as text and the brief, lists and chosen options are still shown

### Requirement: Narrow screens
On a narrow screen the tray SHALL wrap, the Graph tree and its main pane SHALL stack, and the drawer SHALL cover the width of the screen with a close button. Nothing except the diagram and code blocks SHALL scroll horizontally.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the page body does not scroll horizontally and the diagram scrolls inside its own container
