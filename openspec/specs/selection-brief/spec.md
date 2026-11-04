# selection-brief Specification

## Purpose
Lets a person get an AI-written brief for a chosen combination of options without any runtime LLM in the viewer: the page offers a ready prompt, and shows a previously generated brief, fresh or stale, for the same selection.

## Requirements

### Requirement: Prompt for a selection
The design overview SHALL offer a prompt for the current design, containing its name and intent, the constraint values, for each active decided function its choice with title, body and sources, the shortlists, the rejected solutions with their reasons, the function notes, the conflicts, the missing requirements and the undecided functions. The prompt SHALL be shown in a collapsible box with a button that copies it.

#### Scenario: Prompt content
- **WHEN** `CoreXY` is chosen, `Solenoid pen lift` rejected with reason "too loud", and the prompt box is opened
- **THEN** the prompt contains the CoreXY body and sources, `GT2 belt drive` as a missing requirement, the rejection with its reason, and the undecided functions

#### Scenario: Copy
- **WHEN** the user uses "Copy prompt"
- **THEN** the full prompt text is placed in the clipboard

#### Scenario: Empty selection
- **WHEN** the design has no choice, no shortlist, no rejection, no note, no constraint value and no intent
- **THEN** no prompt is offered

### Requirement: Brief cache
A brief SHALL be a Markdown file in `briefs/` whose frontmatter records the design id and name, a hash of the design content and of the chosen nodes' content, the model name and the prompt version. `briefs/index.json` SHALL map each design id to its file. The repository SHALL provide a command that saves a brief from a Markdown file for an exported design file and updates the index.

#### Scenario: Save a brief
- **WHEN** the save command is run with an exported design file and a Markdown file
- **THEN** `briefs/<design id>.md` exists with the frontmatter and the text, and the index maps the id to it

#### Scenario: Save replaces
- **WHEN** a brief is saved for a design that already has one
- **THEN** the file and the index entry are replaced, not duplicated

#### Scenario: Unknown id
- **WHEN** the design file names a node id that is not in `graph.json`
- **THEN** the command fails with a message naming the id and writes nothing

### Requirement: Showing a cached brief
When a brief exists for the current design, the design overview SHALL show it, rendered as Markdown, above the problems. If the hash in the brief differs from the current design and chosen nodes, the brief SHALL be shown marked as stale. When no brief exists the prompt box SHALL be shown.

#### Scenario: Fresh brief
- **WHEN** a brief exists for the design and neither the design nor its chosen nodes changed
- **THEN** the brief is shown with its model name, and without a stale mark

#### Scenario: Stale brief
- **WHEN** the design was edited, or the body of a chosen node changed, after the brief was saved
- **THEN** the brief is shown with a visible stale mark, and the prompt box remains available

#### Scenario: Navigation keeps it fresh
- **WHEN** the user opens nodes, collapses lines and peeks solutions
- **THEN** the brief's stale mark does not change

#### Scenario: No brief
- **WHEN** no brief exists for the design
- **THEN** the prompt box is shown and the overview says that no brief exists yet

#### Scenario: Missing index
- **WHEN** `briefs/index.json` cannot be loaded
- **THEN** the overview behaves as if there were no briefs, and the rest of the page renders

### Requirement: Brief text is not executed
The text of a brief SHALL be displayed as text, and HTML in it SHALL NOT be interpreted.

#### Scenario: HTML in a brief
- **WHEN** a brief contains an HTML tag
- **THEN** it is shown as text

### Requirement: Design key
A brief SHALL be keyed by the design's `id`, so that the brief stays attached to the design as it changes, including after export and import.

#### Scenario: Same design after edits
- **GIVEN** a brief saved for a design
- **WHEN** the user chooses another solution in that design
- **THEN** the brief is still found for the design, marked stale

#### Scenario: New design
- **WHEN** the user starts a New design
- **THEN** no brief is found for it
