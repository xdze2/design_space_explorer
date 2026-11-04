## MODIFIED Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load `graph.json` over HTTP and need no build step beyond producing `graph.json`. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `graph.json`
- **THEN** the graph panel shows the root node and its decisions

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON
- **THEN** the page shows a message naming the problem

### Requirement: Browse view
The left panel SHALL show the whole hierarchy, one line per node, with the open node highlighted. The open node's detail (title, type, confidence, body as Markdown, sources, and its `requires`, `excludes` and `compatible_with` edges as links that open the target node) SHALL be shown in the node modal.

#### Scenario: Open a node
- **WHEN** the user opens the CoreXY node
- **THEN** the modal shows its title, rendered body, sources, and links to the belt option it requires and the leadscrew option it excludes, and its line is highlighted

#### Scenario: Follow an edge
- **WHEN** the user clicks the link to the belt option in the modal
- **THEN** that node becomes the open node

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Outline repeats and marks
A node reached by several parents SHALL appear under each, and from its second appearance on its children SHALL NOT be listed again and the line SHALL be marked as a repeat. Chosen, excluded, undecided, conflicting and needed nodes SHALL be marked on their lines.

#### Scenario: Shared node repeated
- **GIVEN** a node that is a child of two decisions
- **WHEN** the graph is shown
- **THEN** the node appears under both, its own children are listed under the first only, and the second line is marked as a repeat

#### Scenario: Chosen option marked
- **GIVEN** the CoreXY option is selected
- **WHEN** it is visible in the graph
- **THEN** its line is marked as chosen

## REMOVED Requirements

### Requirement: Views are addressable
**Reason**: Page and depth parameters are gone.
**Migration**: See `Addressable view`.

### Requirement: Outline rows
**Reason**: The outline is no longer centred on the open node.
**Migration**: See `Outline layout`.

### Requirement: Outline depth cut
**Reason**: The graph is small and the whole outline fits; the hidden-count lines and `up`/`down` parameters added complexity for no use.
**Migration**: None. Old `up` and `down` parameters are ignored.

### Requirement: Outline link badges
**Reason**: Links are drawn in the link lane and listed in the node modal.
**Migration**: Follow the link curves, or open the node from its `(?)` button.

## ADDED Requirements

### Requirement: Addressable view
The open node and the current selection SHALL be encoded in the URL hash, so that reloading the page or sharing the URL restores the same view. Unknown node ids in the hash SHALL be ignored with a visible notice. Obsolete parameters (`up`, `down`, `layout`) SHALL be ignored.

#### Scenario: Reload restores state
- **GIVEN** the CoreXY option selected and the Leadscrew node open
- **WHEN** the page is reloaded
- **THEN** the same selection and open node are shown

#### Scenario: Unknown id
- **WHEN** the hash refers to `gantry/doesnotexist`
- **THEN** the page shows a notice and still renders the rest of the view

#### Scenario: Obsolete parameters
- **WHEN** the hash has `up=1&down=3&layout=outline`
- **THEN** the page renders normally

### Requirement: Outline layout
The graph SHALL be listed as a preorder tree from the root, one node per line, each line indented by its depth, children in the order of the node's `children`. Every line SHALL have the same height. Right of the names, three lanes SHALL be aligned vertically across all lines: state tags, links, and the `(?)` button.

#### Scenario: Order and indentation
- **WHEN** the graph is shown
- **THEN** the root is first, each decision follows at depth 1, and its options follow it at depth 2

#### Scenario: Aligned lanes
- **WHEN** lines of different depths are shown
- **THEN** their tags, link ends and `(?)` buttons share the same horizontal positions

### Requirement: State tags
Each line SHALL show tags for its state in the tags lane: `chosen`, `excluded by <title>`, `undecided` (decisions), `needs <title>` (a selected node whose requirement is missing) and `needed by <title>` (the missing node itself) and `conflict`. A line with no state SHALL show no tag.

#### Scenario: Chosen and excluded
- **GIVEN** `gantry/corexy` is selected
- **WHEN** the graph is shown
- **THEN** the CoreXY line has a `chosen` tag and the Leadscrew line has an `excluded by CoreXY` tag

#### Scenario: Undecided
- **WHEN** nothing is selected
- **THEN** every decision line has an `undecided` tag

### Requirement: Link lane
The link lane SHALL draw `requires` (arrow), `excludes` (red, dashed) and `compatible_with` (dotted) links as SVG curves joining the lines of the two nodes, one curve per pair for `excludes` and `compatible_with`. Curves SHALL be faint, and emphasized when they touch the open node or the hovered line.

#### Scenario: Link between rows
- **WHEN** the CoreXY option requires the belt option
- **THEN** a curve with an arrow joins the CoreXY line to the belt line in the link lane

#### Scenario: Emphasis
- **WHEN** the user hovers the `CoreXY` line
- **THEN** its `requires` and `excludes` curves are emphasized and the others stay faint

### Requirement: Row actions
Every line SHALL have a `(?)` button, in its lane, that opens the node's modal. Clicking the rest of an option's line SHALL toggle its selection (see `design-page`); clicking a decision's or the root's line SHALL open its modal.

#### Scenario: Button opens, line toggles
- **WHEN** the user clicks the `(?)` of `CoreXY`, then closes the modal and clicks the `CoreXY` line
- **THEN** the first click only opened the modal and the second selected the option
