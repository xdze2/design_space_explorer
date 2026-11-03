# Spec Delta

## MODIFIED Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load `graph.json` over HTTP and need no build step beyond producing `graph.json`. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `graph.json`
- **THEN** the Graph page shows the root node and its decisions

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON
- **THEN** the page shows a message naming the problem

### Requirement: Browse view
The Graph page SHALL show the node hierarchy as an expandable tree and, for the selected node, a main pane beside the tree with title, type, confidence, the body rendered as Markdown, the sources, and its `requires`, `excludes` and `compatible_with` edges as links that open the target node.

#### Scenario: Open a node
- **WHEN** the user selects `gantry/corexy` in the tree
- **THEN** the main pane shows its title, rendered body, sources, and links to `drive/gt2-belt` (requires) and `drive/leadscrew` (excludes)

#### Scenario: Follow an edge
- **WHEN** the user clicks the `drive/gt2-belt` link in the main pane
- **THEN** that node becomes the selected node and is visible in the tree

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Views are addressable
The current page, the open node and the current selection SHALL be encoded in the URL hash, so that reloading the page or sharing the URL restores the same view. Unknown node ids in the hash SHALL be ignored with a visible notice.

#### Scenario: Reload restores state
- **GIVEN** the Design page with `gantry/corexy` selected
- **WHEN** the page is reloaded
- **THEN** the same page and selection are shown

#### Scenario: Unknown id
- **WHEN** the hash refers to `gantry/doesnotexist`
- **THEN** the page shows a notice and still renders the rest of the view

## REMOVED Requirements

### Requirement: Select view
**Reason**: Choosing and the selection consequences are split between the node views and the Design page.
**Migration**: See `design-page` ("Choosing options", "Design page layout") and `selection-workspace` ("Selection consequences").
