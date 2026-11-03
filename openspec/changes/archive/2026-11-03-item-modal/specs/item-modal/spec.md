# Spec Delta

## Purpose

Separates choosing options from reading them: the panel toggles and resets the selection, and node detail opens in a modal over the current page.

## ADDED Requirements

### Requirement: Node detail in a modal
Opening a node SHALL show its detail in a modal on top of the current page, without changing the page or the selection. The modal SHALL show the title, type, confidence, body rendered as Markdown, sources, and links for `requires`, `excludes` and `compatible_with`. Following one of those links SHALL show that node in the same modal.

#### Scenario: Open from the panel
- **WHEN** the user uses the view action of `gantry/corexy` in the panel while on the Selection page
- **THEN** a modal with the CoreXY detail opens and the Selection page stays behind it

#### Scenario: Follow an edge
- **GIVEN** the modal shows `gantry/corexy`
- **WHEN** the user follows the `drive/gt2-belt` link in `Requires`
- **THEN** the modal shows `drive/gt2-belt`

### Requirement: Closing the modal
Esc, a close button and a click on the backdrop SHALL each close the modal. Closing SHALL leave the page and the selection unchanged.

#### Scenario: Escape
- **GIVEN** the modal is open
- **WHEN** the user presses Esc
- **THEN** the modal is closed and the previous page is shown unchanged

#### Scenario: Backdrop
- **WHEN** the user clicks outside the modal content
- **THEN** the modal is closed

### Requirement: Select from the modal
For an option node the modal SHALL show a button that adds it to the selection or, if already selected, removes it, following the one-option-per-decision rule. The modal SHALL stay open on the same node. Other node types SHALL not show the button.

#### Scenario: Select
- **WHEN** the modal shows `gantry/corexy` and the user uses the button
- **THEN** the option is selected, it appears chosen in the panel, and the modal still shows `gantry/corexy` with the button now offering removal

#### Scenario: Decision node
- **WHEN** the modal shows the `gantry` decision
- **THEN** no select button is shown

### Requirement: Modal state in the URL
The open node SHALL be encoded in the URL hash as `view=<id>`, independently of the page and the selection. Unknown ids SHALL be ignored with the existing notice.

#### Scenario: Reload keeps the modal
- **GIVEN** the modal shows `gantry/corexy` on the Selection page with `drive/gt2-belt` selected
- **WHEN** the page is reloaded
- **THEN** the same page, selection and modal are shown

#### Scenario: Back button
- **GIVEN** the user opened the modal from the Selection page
- **WHEN** the user uses the browser back button
- **THEN** the modal is closed and the Selection page is shown

#### Scenario: Old browse link
- **WHEN** the hash is `#/browse/gantry/corexy`
- **THEN** the Browse page is shown with the modal on `gantry/corexy`

### Requirement: Panel actions
Each option in the panel SHALL have a toggle action and a separate view action. The panel SHALL have a Reset button that clears the selection and keeps the current page, and the application title SHALL link to the Selection page with an empty selection.

#### Scenario: Toggle does not open
- **WHEN** the user uses the toggle action of an option
- **THEN** the selection changes and no modal opens

#### Scenario: Reset
- **GIVEN** `gantry/corexy` and `drive/gt2-belt` are selected on the Browse page
- **WHEN** the user presses Reset
- **THEN** the selection is empty and the Browse page is still shown

#### Scenario: Home
- **WHEN** the user follows the title link
- **THEN** the Selection page is shown with an empty selection and no modal

### Requirement: Browse overview
The Browse page SHALL be full width, without the selection panel, and SHALL show the whole graph as an expanded tree in which currently chosen options are marked. Activating a node SHALL open it in the modal.

#### Scenario: No panel
- **WHEN** the user opens the Browse page
- **THEN** the selection panel is not shown and the tree uses the full width

#### Scenario: Open from the tree
- **WHEN** the user activates `Leadscrew` in the tree
- **THEN** the modal shows `drive/leadscrew` over the Browse page

#### Scenario: Chosen marked
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the Browse page is shown
- **THEN** `CoreXY` is marked as chosen in the tree

#### Scenario: Selection kept
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the user switches between Browse and Selection
- **THEN** the selection is unchanged
