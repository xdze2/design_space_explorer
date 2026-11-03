# Spec Delta

## MODIFIED Requirements

### Requirement: Browse view
The Graph page SHALL show the hierarchy as an outline centred on the open node (the root when none is open), and, beside it, a main pane for the open node with title, type, confidence, the body rendered as Markdown, the sources, and its `requires`, `excludes` and `compatible_with` edges as links that open the target node. Activating a line of the outline SHALL open that node and recentre the outline on it.

#### Scenario: Open a node
- **WHEN** the user activates the CoreXY line in the outline
- **THEN** the main pane shows its title, rendered body, sources, and links to the belt option it requires and the leadscrew option it excludes, and the outline is centred on it

#### Scenario: Follow an edge
- **WHEN** the user clicks the link to the belt option in the main pane
- **THEN** that node becomes the open node and the outline is centred on it

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Views are addressable
The current page, the open node, the current selection and, on the Graph page, the outline depths SHALL be encoded in the URL hash, so that reloading the page or sharing the URL restores the same view. Opening another node SHALL reset the depths to their defaults. Unknown node ids in the hash SHALL be ignored with a visible notice, and invalid depths SHALL fall back to the defaults.

#### Scenario: Reload restores state
- **GIVEN** the Design page with the CoreXY option selected
- **WHEN** the page is reloaded
- **THEN** the same page and selection are shown

#### Scenario: Unknown id
- **WHEN** the hash refers to `gantry/doesnotexist`
- **THEN** the page shows a notice and still renders the rest of the view

#### Scenario: Depths in the hash
- **WHEN** the Graph page is opened with `up=1&down=3`
- **THEN** the outline shows one level above and three levels below the open node

#### Scenario: Depths reset on navigation
- **GIVEN** the Graph page was opened with `down=4`
- **WHEN** the user activates another line of the outline
- **THEN** the new hash has no `down` and the default depth applies

#### Scenario: Invalid depth
- **WHEN** the hash has `down=abc` or `up=-2`
- **THEN** the defaults apply and the page renders normally

## ADDED Requirements

### Requirement: Outline rows
The outline SHALL list the nodes above the open node as a mirrored tree (parents closest to it, their parents above them), then the open node, then its descendants as a tree, one node per line, each line indented by its distance from the open node. Parents SHALL be ordered with the first parent closest to the open node, and children by title.

#### Scenario: Two parents
- **GIVEN** a node with two parents, each with a parent of its own
- **WHEN** it is the open node
- **THEN** both parents are lines above it, each with its own parent listed above it, and the first parent is the line directly above the open node

#### Scenario: Root as the focus
- **WHEN** no node is open
- **THEN** the outline starts at the root, has no lines above it and lists the decisions below it

### Requirement: Outline repeats and marks
A node reached by several paths SHALL appear on each path, and from its second appearance on its relatives SHALL NOT be listed again and the line SHALL be marked as a repeat. A chosen option SHALL be marked on its line.

#### Scenario: Shared node repeated
- **GIVEN** a node that is a child of two decisions, both below the open node
- **WHEN** the outline is shown
- **THEN** the node appears under both decisions, its own children are listed under the first only, and the second line is marked as a repeat

#### Scenario: Chosen option marked
- **GIVEN** the CoreXY option is selected
- **WHEN** it is visible in the outline
- **THEN** its line is marked as chosen

### Requirement: Outline depth cut
The outline SHALL show at most `up` levels above and `down` levels below the open node, 3 and 2 by default. Where nodes are cut, the line at the cut SHALL say how many nodes are hidden and, when activated, SHALL keep the open node and add two levels in that direction.

#### Scenario: Default cut
- **GIVEN** a node with descendants five levels deep
- **WHEN** it is the open node
- **THEN** descendants down to level two are shown, and the last lines say how many more are hidden

#### Scenario: Show more
- **WHEN** the user activates the hidden-descendants line
- **THEN** the same node stays open, `down` is two higher in the hash, and two more levels are shown

#### Scenario: Cut ancestors
- **GIVEN** a node with ancestors five levels up
- **WHEN** it is the open node
- **THEN** only three levels above are shown, with a line at the top saying how many more are hidden

#### Scenario: Nothing hidden
- **WHEN** the open node has no nodes beyond the shown levels
- **THEN** no hidden-nodes line is shown

### Requirement: Outline link badges
Each outline line whose node has `requires`, `excludes` or `compatible_with` links SHALL show a badge per link with its kind and target title, and activating a badge SHALL open the target node. Badges SHALL NOT change the order or indentation of lines.

#### Scenario: Excludes badge
- **GIVEN** the CoreXY option excludes the leadscrew option
- **WHEN** the CoreXY line is in the outline
- **THEN** it shows an `excludes` badge with the leadscrew title, and activating it opens the leadscrew node

#### Scenario: No links
- **WHEN** a node has no `requires`, `excludes` or `compatible_with` links
- **THEN** its line has no badge
