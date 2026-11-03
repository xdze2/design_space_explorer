# Spec Delta

## MODIFIED Requirements

### Requirement: Prompt for a selection
The Design page SHALL offer a prompt for the current selection, containing for each selected node its title, body and sources, plus the conflicts, the missing requirements and the undecided decisions. The prompt SHALL be shown in a collapsible box with a button that copies it.

#### Scenario: Prompt content
- **WHEN** `gantry/corexy` is selected and the prompt box is opened
- **THEN** the prompt contains the CoreXY body and sources, `drive/gt2-belt` as a missing requirement, and the undecided decisions

#### Scenario: Copy
- **WHEN** the user uses "Copy prompt"
- **THEN** the full prompt text is placed in the clipboard

#### Scenario: Empty selection
- **WHEN** nothing is selected
- **THEN** no prompt is offered

### Requirement: Showing a cached brief
When a brief exists for the current selection, the Design page SHALL show it, rendered as Markdown, below the diagram and above the deterministic summary. If the node-content hash in the brief differs from the current content of the selected nodes, the brief SHALL be shown marked as stale. When no brief exists the prompt box SHALL be shown.

#### Scenario: Fresh brief
- **WHEN** a brief exists for the selection and the selected nodes are unchanged
- **THEN** the brief is shown above the summary, with its model name, and without a stale mark

#### Scenario: Stale brief
- **WHEN** the body of a selected node changed after the brief was saved
- **THEN** the brief is shown with a visible stale mark, and the prompt box remains available

#### Scenario: No brief
- **WHEN** no brief exists for the selection
- **THEN** the prompt box is shown and the page says that no brief exists yet

#### Scenario: Missing index
- **WHEN** `briefs/index.json` cannot be loaded
- **THEN** the page behaves as if there were no briefs, and the rest of the page renders
