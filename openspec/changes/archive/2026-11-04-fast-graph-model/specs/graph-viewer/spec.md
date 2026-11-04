## MODIFIED Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load `graph.json` over HTTP and need no build step beyond producing `graph.json`. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `graph.json`
- **THEN** the graph panel shows the root function and its how-children

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON
- **THEN** the page shows a message naming the problem

### Requirement: Browse view
The left panel SHALL show the whole `how` tree, one line per node, with the open node highlighted, followed by the constraint nodes as a separate group. The open node's detail (title, type, confidence, body as Markdown, sources, its `why` and `how` nodes, the functions it constrains or the constraints on it, and its `requires`, `excludes` and `compatible_with` edges, each as links that open the target node) SHALL be shown in the node modal.

#### Scenario: Open a node
- **WHEN** the user opens the CoreXY node
- **THEN** the modal shows its title, rendered body, sources, its why, its how, and links to the belt solution it requires and the leadscrew solution it excludes, and its line is highlighted

#### Scenario: Open a constraint
- **WHEN** the user opens the Paper size line in the constraint group
- **THEN** the modal shows its body and a link to the function it constrains

#### Scenario: Follow an edge
- **WHEN** the user clicks the link to the belt solution in the modal
- **THEN** that node becomes the open node

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Outline repeats and marks
A node reached by several whys SHALL appear under each, and from its second appearance on its how-children SHALL NOT be listed again and the line SHALL be marked as a repeat. Chosen, excluded, undecided, conflicting and needed nodes SHALL be marked on their lines.

#### Scenario: Shared node repeated
- **GIVEN** a function that is a how-child of two solutions
- **WHEN** the graph is shown
- **THEN** the function appears under both, its own children are listed under the first only, and the second line is marked as a repeat

#### Scenario: Chosen option marked
- **GIVEN** the CoreXY solution is selected
- **WHEN** it is visible in the graph
- **THEN** its line is marked as chosen

### Requirement: Outline layout
The graph SHALL be listed as a preorder tree of `how` links from the root, one node per line, each line indented by its depth, children in the order of the node's `how` list in `graph.json`, which is the author's order. Every line SHALL have the same height. Right of the names, three lanes SHALL be aligned vertically across all lines: state tags, links, and the `(?)` button. Constraint nodes SHALL be listed after the tree, in the same line layout.

#### Scenario: Order and indentation
- **WHEN** the graph is shown
- **THEN** the root function is first, each first-level function follows at depth 1, and its solutions follow it at depth 2

#### Scenario: Author order
- **GIVEN** a function whose `how` list is `[B, A]` while "A" sorts before "B" by title
- **WHEN** the graph is shown
- **THEN** B's line comes before A's under the function

#### Scenario: Aligned lanes
- **WHEN** lines of different depths are shown
- **THEN** their tags, link ends and `(?)` buttons share the same horizontal positions

#### Scenario: Constraints listed
- **WHEN** the graph is shown
- **THEN** the constraint nodes appear after the tree

### Requirement: State tags
Each line SHALL show tags for its state in the tags lane: `chosen`, `excluded by <title>`, `undecided` (a decision: a function whose how-targets are solutions, none selected), `needs <title>` (a selected node whose requirement is missing) and `needed by <title>` (the missing node itself) and `conflict`. A line with no state SHALL show no tag.

#### Scenario: Chosen and excluded
- **GIVEN** the CoreXY solution is selected
- **WHEN** the graph is shown
- **THEN** the CoreXY line has a `chosen` tag and the Leadscrew line has an `excluded by CoreXY` tag

#### Scenario: Undecided
- **WHEN** nothing is selected
- **THEN** every decision line has an `undecided` tag

### Requirement: Row actions
Every line SHALL have a `(?)` button, in its lane, that opens the node's modal. Clicking the rest of a solution's line SHALL toggle its selection (see `design-page`); clicking the line of a function, a constraint or a component SHALL open its modal.

#### Scenario: Button opens, line toggles
- **WHEN** the user clicks the `(?)` of `CoreXY`, then closes the modal and clicks the `CoreXY` line
- **THEN** the first click only opened the modal and the second selected the solution

## ADDED Requirements

### Requirement: Node type icons
Every line of the graph panel SHALL show, before the title, a small icon for the node's type (function, solution, component or constraint), the four icons being visibly different in shape. Icons SHALL NOT use external assets, SHALL NOT change the height of a line, and SHALL stay readable in the page's theme. The graph panel SHALL show a short legend of the four icons with their type names, and the node modal SHALL show the node's type icon next to its title.

#### Scenario: Icon on every line
- **WHEN** the graph is shown
- **THEN** each line has one type icon, and lines of different types have different icons

#### Scenario: Legend
- **WHEN** the graph panel is shown
- **THEN** it has a legend naming function, solution, component and constraint with their icons

#### Scenario: Icon in the modal
- **WHEN** the user opens a node
- **THEN** the modal title is preceded by the icon of the node's type

#### Scenario: Same row height
- **WHEN** lines of all four types are shown
- **THEN** all lines have the same height
