# selection-brief Specification

## Purpose
Lets a person get an AI-written brief for a chosen combination of options without any runtime LLM in the viewer: the page offers a ready prompt, and shows a previously generated brief, fresh or stale, for the same selection.

## Requirements

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

### Requirement: Selection key
Each selection SHALL have a key that is the same for the same set of options in any order, and different for a different set.

#### Scenario: Order does not matter
- **WHEN** the selections `gantry/corexy,drive/gt2-belt` and `drive/gt2-belt,gantry/corexy` are compared
- **THEN** they have the same key

### Requirement: Brief cache
A brief SHALL be a Markdown file in `briefs/` whose frontmatter records the selected ids, a hash of the selected nodes' content, the model name and the prompt version. `briefs/index.json` SHALL map each selection key to its file. The repository SHALL provide a command that saves a brief from a file for a given selection and updates the index.

#### Scenario: Save a brief
- **WHEN** the save command is run with a selection and a Markdown file
- **THEN** `briefs/<key>.md` exists with the frontmatter and the text, and the index maps the key to it

#### Scenario: Save replaces
- **WHEN** a brief is saved for a selection that already has one
- **THEN** the file and the index entry are replaced, not duplicated

#### Scenario: Unknown id
- **WHEN** the save command is given an id that is not in `graph.json`
- **THEN** it fails with a message naming the id and writes nothing

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

### Requirement: Brief text is not executed
The text of a brief SHALL be displayed as text, and HTML in it SHALL NOT be interpreted.

#### Scenario: HTML in a brief
- **WHEN** a brief contains an HTML tag
- **THEN** it is shown as text
