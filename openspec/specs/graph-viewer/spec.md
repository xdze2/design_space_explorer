# graph-viewer Specification

## Purpose
A static web page that loads the compiled `graph.json` and lets a person browse the design knowledge and try out a combination of options, with no backend and no runtime LLM.

## Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load `graph.json` over HTTP and need no build step beyond producing `graph.json`. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `graph.json`
- **THEN** the Browse view shows the root node and its decisions

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON
- **THEN** the page shows a message naming the problem

### Requirement: Browse view
The Browse view SHALL show the node hierarchy as an expandable tree and, for the selected node, a detail pane with title, type, confidence, the body rendered as Markdown, the sources, and its `requires`, `excludes` and `compatible_with` edges as links that open the target node.

#### Scenario: Open a node
- **WHEN** the user selects `gantry/corexy` in the tree
- **THEN** the detail pane shows its title, rendered body, sources, and links to `drive/gt2-belt` (requires) and `drive/leadscrew` (excludes)

#### Scenario: Follow an edge
- **WHEN** the user clicks the `drive/gt2-belt` link in the detail pane
- **THEN** that node becomes the selected node and is visible in the tree

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Select view
The Select view SHALL let the user choose at most one option per decision, and SHALL show for the current selection: the options excluded by it, the nodes required by it that are not selected, and any conflict between two selected options.

#### Scenario: Exclusion shown
- **WHEN** the user selects `gantry/corexy`
- **THEN** `drive/leadscrew` is shown as excluded, with the selected node responsible named

#### Scenario: Missing requirement shown
- **WHEN** the user selects `gantry/corexy` and no option of `drive` is selected
- **THEN** `drive/gt2-belt` is listed as required but not selected, and the user can select it from the list

#### Scenario: One option per decision
- **WHEN** the user selects `gantry/h-bot` while `gantry/corexy` is selected
- **THEN** `gantry/h-bot` replaces `gantry/corexy` in the selection

#### Scenario: Conflict
- **WHEN** the selection contains `gantry/corexy` and `drive/leadscrew`
- **THEN** the conflict between the two is shown

### Requirement: Views are addressable
The current view, the selected node and the current selection SHALL be encoded in the URL hash, so that reloading the page or sharing the URL restores the same view. Unknown node ids in the hash SHALL be ignored with a visible notice.

#### Scenario: Reload restores state
- **GIVEN** the Select view with `gantry/corexy` selected
- **WHEN** the page is reloaded
- **THEN** the same view and selection are shown

#### Scenario: Unknown id
- **WHEN** the hash refers to `gantry/doesnotexist`
- **THEN** the page shows a notice and still renders the rest of the view

### Requirement: Local serving
The repository SHALL provide a single command that serves the viewer and `graph.json` locally.

#### Scenario: Serve
- **WHEN** the serve command is run
- **THEN** it prints a local URL at which the viewer loads the current `graph.json`
