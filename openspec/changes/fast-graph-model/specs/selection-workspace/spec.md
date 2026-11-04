## MODIFIED Requirements

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
