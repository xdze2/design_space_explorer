# selection-workspace Specification

## Purpose
The main view presenting the current selection, so a person can build a combination of options in the graph panel and see what it implies.

## Requirements

### Requirement: Selection page
The main view SHALL show each selected option with its title, its body rendered as Markdown and its sources, after the brief area and the consequences lists, and SHALL show an empty state when nothing is selected.

#### Scenario: Chosen options with prose
- **WHEN** `gantry/corexy` and `drive/gt2-belt` are selected
- **THEN** the main view shows both, each with its rendered body and sources

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the main view says so and points to the graph

### Requirement: Selection consequences
The main view SHALL list the decisions that have no selected option, the nodes required by the selection that are not selected (each with a select action), and the conflicts between selected options. Only direct `requires` and `excludes` edges SHALL be considered.

#### Scenario: Undecided decisions
- **WHEN** only `gantry/corexy` is selected
- **THEN** `drive`, `controller`, `linear-guide` and `pen-lift` are listed as undecided

#### Scenario: Missing requirement
- **WHEN** `gantry/corexy` is selected and no option of `drive` is selected
- **THEN** `drive/gt2-belt` is listed as required but not selected, and selecting it from the list adds it to the selection

#### Scenario: Conflict
- **WHEN** the selection contains `gantry/corexy` and `drive/leadscrew`
- **THEN** the conflict between the two is shown

### Requirement: Page and selection in the URL
The current selection SHALL be encoded in the URL hash independently of the open node, so that following a link keeps the others. Unknown node ids in the hash SHALL be ignored with a visible notice.

#### Scenario: Selection survives navigation
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user opens a node
- **THEN** the selection is unchanged

#### Scenario: Reload restores state
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the page is reloaded
- **THEN** the same selection is shown

#### Scenario: Unknown id
- **WHEN** the hash selects `gantry/doesnotexist`
- **THEN** a notice is shown and the rest of the page renders
