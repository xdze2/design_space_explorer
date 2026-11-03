# selection-workspace Specification

## Purpose
A selection panel shown on every page and a Selection page presenting the current selection, so a person can build a combination of options and see what it implies while reading any part of the graph.

## Requirements

### Requirement: Persistent selection panel
The viewer SHALL show a selection panel beside the main content on every page. The panel SHALL list the options grouped by decision and let the user choose at most one option per decision.

#### Scenario: Panel on every page
- **WHEN** the user opens the Selection page or the Browse page
- **THEN** the same panel is shown with the same current selection

#### Scenario: One option per decision
- **WHEN** the user chooses `gantry/h-bot` while `gantry/corexy` is selected
- **THEN** `gantry/h-bot` replaces `gantry/corexy` in the selection

#### Scenario: Unselect
- **WHEN** the user clicks a selected option in the panel
- **THEN** it is removed from the selection

### Requirement: Excluded options in the panel
The panel SHALL show options excluded by the current selection as disabled, naming the selected option responsible.

#### Scenario: Exclusion shown
- **WHEN** the user selects `gantry/corexy`
- **THEN** `drive/leadscrew` is shown disabled with `CoreXY` named as the cause

### Requirement: Selection page
The Selection page SHALL show each selected option with its title, its body rendered as Markdown and its sources, and SHALL show an empty state when nothing is selected.

#### Scenario: Chosen options with prose
- **WHEN** `gantry/corexy` and `drive/gt2-belt` are selected
- **THEN** the page shows both, each with its rendered body and sources

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the page says so and points to the panel

### Requirement: Selection consequences
The Selection page SHALL list the decisions that have no selected option, the nodes required by the selection that are not selected (each with a select action), and the conflicts between selected options. Only direct `requires` and `excludes` edges SHALL be considered.

#### Scenario: Undecided decisions
- **WHEN** only `gantry/corexy` is selected
- **THEN** `drive`, `controller`, `linear-guide` and `pen-lift` are listed as undecided

#### Scenario: Missing requirement
- **WHEN** `gantry/corexy` is selected and no option of `drive` is selected
- **THEN** `drive/gt2-belt` is listed as required but not selected, and selecting it from the list adds it to the selection

#### Scenario: Conflict
- **WHEN** the selection contains `gantry/corexy` and `drive/leadscrew`
- **THEN** the conflict between the two is shown

### Requirement: Browse selection button
The Browse detail pane SHALL show, for an option node, a button that adds it to the selection or, if already selected, removes it. Other node types SHALL not show the button.

#### Scenario: Select from Browse
- **WHEN** the user opens `gantry/corexy` in Browse and uses the button
- **THEN** the option is selected and appears chosen in the panel, and the Browse page stays on the same node

#### Scenario: Decision node
- **WHEN** the user opens the `gantry` decision node in Browse
- **THEN** no select button is shown

### Requirement: Page and selection in the URL
The current page and the current selection SHALL be encoded in the URL hash independently, so that following a link or using the panel on one page keeps the other. Unknown node ids in the hash SHALL be ignored with a visible notice.

#### Scenario: Selection survives navigation
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user opens a node in Browse
- **THEN** the selection is unchanged

#### Scenario: Reload restores state
- **GIVEN** the Selection page with `gantry/corexy` selected
- **WHEN** the page is reloaded
- **THEN** the same page and selection are shown

#### Scenario: Unknown id
- **WHEN** the hash selects `gantry/doesnotexist`
- **THEN** a notice is shown and the rest of the page renders

### Requirement: Narrow screens
On a narrow screen the panel and the main content SHALL stack in one column without horizontal scrolling.

#### Scenario: Phone width
- **WHEN** the viewport is about 400px wide
- **THEN** the panel is shown above the main content and nothing overflows horizontally
