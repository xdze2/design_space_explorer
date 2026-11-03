# Spec Delta

## MODIFIED Requirements

### Requirement: Views and routes
The viewer SHALL have a Graph page and a Design page, and the Design page SHALL be the default. The hash SHALL encode the page, the selection (`pick`), the open node (`view`) and, on the Graph page, the outline depths (`up`, `down`) independently. `#/selection` SHALL be read as Design and `#/browse` and `#/browse/<id>` as Graph (with `view=<id>` for the latter, root meaning none). Unknown node ids SHALL be ignored with the existing visible notice.

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

### Requirement: Choosing options
An option SHALL be chosen or unchosen from the option's node view and from its decision's node view. A decision's node view SHALL list its options with a choose action each, at most one option per decision, and SHALL show options excluded by the current selection as disabled, naming the selected option responsible. The Graph outline SHALL mark chosen options. Decision and other non-option nodes SHALL show no choose action for themselves.

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
Opening a node on the Design page SHALL show it in a side drawer next to the page, which stays visible and unchanged. Opening a node on the Graph page SHALL show it in the main pane beside the outline, with no overlay. The node view SHALL show title, type, confidence, body as Markdown, sources, links for `requires`, `excludes` and `compatible_with`, and for an option the choose action. Following an edge link SHALL show that node in the same place. No modal SHALL be used.

#### Scenario: Drawer on Design
- **WHEN** the user activates a chip or a diagram box on the Design page
- **THEN** a drawer shows that node and the Design page stays rendered beside it

#### Scenario: Close the drawer
- **WHEN** the user presses Esc or the close button of the drawer
- **THEN** the drawer is closed and the selection is unchanged

#### Scenario: Main pane on Graph
- **WHEN** the user activates `Leadscrew` in the Graph outline
- **THEN** the main pane shows `drive/leadscrew` beside the outline and nothing overlays the page

#### Scenario: Follow an edge
- **GIVEN** `gantry/corexy` is shown
- **WHEN** the user follows the `drive/gt2-belt` link
- **THEN** `drive/gt2-belt` is shown in the same place

### Requirement: Narrow screens
On a narrow screen the tray SHALL wrap, the Graph outline and its main pane SHALL stack, and the drawer SHALL cover the width of the screen with a close button. Nothing except the diagram and code blocks SHALL scroll horizontally, and a long outline line SHALL wrap instead of widening the page.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the page body does not scroll horizontally and the diagram scrolls inside its own container
