## MODIFIED Requirements

### Requirement: Prompt for a selection
The Design page SHALL offer a prompt for the current selection, containing for each selected node its title, body and sources, plus the conflicts, the missing requirements and the undecided functions (functions whose how-targets are solutions and none is selected). The prompt SHALL be shown in a collapsible box with a button that copies it.

#### Scenario: Prompt content
- **WHEN** `gantry/corexy` is selected and the prompt box is opened
- **THEN** the prompt contains the CoreXY body and sources, `drive/gt2-belt` as a missing requirement, and the undecided functions

#### Scenario: Copy
- **WHEN** the user uses "Copy prompt"
- **THEN** the full prompt text is placed in the clipboard

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** no prompt is offered
