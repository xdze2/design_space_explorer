# selection-workspace Specification

## Purpose
A selection panel shown on every page and a Selection page presenting the current selection, so a person can build a combination of options and see what it implies while reading any part of the graph.

## Requirements

### Requirement: Selection page
The Design page SHALL show each selected option with its title, its body rendered as Markdown and its sources, after the diagram, the brief area and the consequences lists, and SHALL show an empty state when nothing is selected.

#### Scenario: Chosen options with prose
- **WHEN** `gantry/corexy` and `drive/gt2-belt` are selected
- **THEN** the page shows both, each with its rendered body and sources

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** the page says so and points to the Graph page or the diagram

### Requirement: Selection consequences
The Design page SHALL list the decisions that have no selected option, the nodes required by the selection that are not selected (each with a select action), and the conflicts between selected options. Only direct `requires` and `excludes` edges SHALL be considered.

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
The current page (`design` or `graph`) and the current selection SHALL be encoded in the URL hash independently, so that following a link or using the tray on one page keeps the other. Unknown node ids in the hash SHALL be ignored with a visible notice.

#### Scenario: Selection survives navigation
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user opens a node on the Graph page
- **THEN** the selection is unchanged

#### Scenario: Reload restores state
- **GIVEN** the Design page with `gantry/corexy` selected
- **WHEN** the page is reloaded
- **THEN** the same page and selection are shown

#### Scenario: Unknown id
- **WHEN** the hash selects `gantry/doesnotexist`
- **THEN** a notice is shown and the rest of the page renders
