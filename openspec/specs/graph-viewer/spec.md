# graph-viewer Specification

## Purpose
A static web page that loads the compiled `graph.json` and lets a person browse the design knowledge and try out a combination of options, with no backend and no runtime LLM.

## Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load `graph.json` over HTTP and need no build step beyond producing `graph.json`. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `graph.json`
- **THEN** the graph panel shows the root function and its how-children

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON
- **THEN** the page shows a message naming the problem

### Requirement: Browse view
The left panel SHALL show the design tree (see Design tree layout) with the open node highlighted, followed by the constraint nodes as a separate group. The open node's detail SHALL be shown in the node panel (see `design-page`).

#### Scenario: Open a node
- **WHEN** the user clicks the `CoreXY` chip
- **THEN** the node panel shows `CoreXY` and its chip is highlighted

#### Scenario: Open a constraint
- **WHEN** the user clicks the Paper format line in the constraint group
- **THEN** the node panel shows its body, the function it constrains and its value in the design

#### Scenario: Follow an edge
- **WHEN** the user follows the link to the belt solution in the node panel
- **THEN** that node becomes the open node and its chip is highlighted

#### Scenario: Body is not executed as HTML
- **WHEN** a node body contains HTML tags
- **THEN** they are shown as text, not interpreted

### Requirement: Local serving
The repository SHALL provide a single command that serves the viewer and `graph.json` locally.

#### Scenario: Serve
- **WHEN** the serve command is run
- **THEN** it prints a local URL at which the viewer loads the current `graph.json`

### Requirement: Outline repeats and marks
A function shown under several visible parents SHALL appear under each, and from its second appearance on its children SHALL NOT be listed again and the line SHALL be marked as a repeat. Function lines SHALL be marked with their status in the design (open, exploring, decided) and marked when they hold a problem.

#### Scenario: Shared node repeated
- **GIVEN** a function that is a how-child of two visible solutions
- **WHEN** the graph is shown
- **THEN** the function appears under both, its own children are listed under the first only, and the second line is marked as a repeat

#### Scenario: Chosen option marked
- **GIVEN** `CoreXY` is chosen
- **WHEN** the graph is shown
- **THEN** the `Move the pen in XY` line is marked decided and the `CoreXY` chip is chosen

### Requirement: Addressable view
The open node, the collapsed lines and the peeked solutions SHALL be encoded in the URL hash, so that reloading or sharing the URL restores the same view. The design SHALL NOT be in the hash. Unknown node ids in the hash SHALL be ignored with a visible notice. Obsolete parameters (`up`, `down`, `layout`) SHALL be ignored, and `pick` SHALL be ignored with a notice.

#### Scenario: Reload restores state
- **GIVEN** the Leadscrew node open and `CoreXY` peeked
- **WHEN** the page is reloaded
- **THEN** the same node is open and `CoreXY`'s sub-functions are shown peeked

#### Scenario: Unknown id
- **WHEN** the hash refers to an id that is not in the graph
- **THEN** the page shows a notice and still renders the rest of the view

#### Scenario: Obsolete parameters
- **WHEN** the hash has `up=1&down=3&layout=outline`
- **THEN** the page renders normally

### Requirement: Design tree layout
The graph SHALL be listed as a preorder tree from the root with one line per function, indented by depth. A function whose how-targets are solutions SHALL show them as chips on its line, in the author's order; below it SHALL be listed the how-targets (functions and components) of its chosen solution only. A function whose how-targets are functions SHALL list them below. Constraint nodes SHALL be listed after the tree.

#### Scenario: Nothing chosen
- **WHEN** the design is empty
- **THEN** the root is first, `Move the pen in XY`, `Lift and lower the pen` and `Turn G-code into motion` follow at depth 1 with their solutions as chips, and nothing is listed below them

#### Scenario: Chosen solution expands
- **WHEN** `Cartesian, two Y rails` is chosen
- **THEN** `Transmit motor motion`, `Guide the axes` and `Keep the gantry square` are listed at depth 2 under `Move the pen in XY`

#### Scenario: Components of a choice
- **WHEN** `Servo pen lift` is chosen
- **THEN** `Micro servo` and `Spring-loaded 3D-printed pen holder` are listed under `Lift and lower the pen` as component lines

#### Scenario: Author order
- **GIVEN** a function whose `how` list is `[B, A]` while "A" sorts before "B" by title
- **WHEN** the graph is shown
- **THEN** B's chip comes before A's on the function line

#### Scenario: Constraints listed
- **WHEN** the graph is shown
- **THEN** the constraint nodes appear after the tree

### Requirement: Line and chip actions
Clicking a function, component or constraint line, or a solution chip, SHALL open that node in the node panel and SHALL NOT change the design. A function line with something listed below it SHALL have a collapse toggle; a solution chip whose solution has how-targets SHALL have a peek toggle.

#### Scenario: Chip opens
- **WHEN** the user clicks the `CoreXY` chip
- **THEN** the node panel shows `CoreXY` and the design is unchanged

#### Scenario: Line opens
- **WHEN** the user clicks the `Lift and lower the pen` line
- **THEN** the node panel shows the function and the design is unchanged

### Requirement: Type icons
Every line of the graph panel SHALL show, before the title, a small icon for the node's type (function, component or constraint), and every chip SHALL show the solution icon; the four icons SHALL be visibly different in shape. Icons SHALL NOT use external assets and SHALL stay readable in the page's theme. The graph panel SHALL show a short legend of the four icons with their type names and of the chip states, and the node panel SHALL show the node's type icon next to its title.

#### Scenario: Icon on every line
- **WHEN** the graph is shown
- **THEN** each line and chip has one type icon, and different types have different icons

#### Scenario: Legend
- **WHEN** the graph panel is shown
- **THEN** it has a legend naming function, solution, component and constraint with their icons, and the chip states

#### Scenario: Icon in the node panel
- **WHEN** the user opens a node
- **THEN** the panel title is preceded by the icon of the node's type

### Requirement: Solution chips
Each solution chip SHALL show one state from the design, by priority: chosen, rejected, excluded (by a chosen solution), required (by a chosen solution), shortlisted, open. A chosen chip that is also excluded or required SHALL be marked as a conflict. The chip's tooltip SHALL name the cause of an excluded or required state. Chip states SHALL be told apart by more than color alone.

#### Scenario: Chosen and excluded
- **GIVEN** `CoreXY` is chosen
- **WHEN** the graph is shown
- **THEN** the `CoreXY` chip is chosen, the `Leadscrew drive` chip is excluded with `CoreXY` named in its tooltip, and the `GT2 belt drive` chip is required

#### Scenario: Conflict
- **GIVEN** `CoreXY` and `Leadscrew drive` are both chosen
- **WHEN** the graph is shown
- **THEN** the `Leadscrew drive` chip is chosen and marked as a conflict

#### Scenario: Shortlisted and rejected
- **GIVEN** `FluidNC on ESP32` is shortlisted and `GRBL on Arduino Uno with CNC shield` rejected
- **WHEN** the graph is shown
- **THEN** their chips show those states

### Requirement: Peek
Peeking a solution SHALL list its how-targets under its function, marked dormant, without choosing it. Lines under a peeked solution SHALL behave as other lines (open, collapse, peek further). Peeking a second solution of the same function SHALL replace the first. Peeking the chosen solution SHALL do nothing.

#### Scenario: Peek an undecided gantry
- **GIVEN** nothing is chosen under `Move the pen in XY`
- **WHEN** the user toggles peek on `CoreXY`
- **THEN** `Transmit motor motion` and `Guide the axes` are listed under the function, marked dormant, and the design is unchanged

#### Scenario: Unpeek
- **WHEN** the user toggles peek on `CoreXY` again
- **THEN** its sub-functions are hidden again

### Requirement: Collapse
A collapsed function line SHALL hide everything listed below it and show how many lines are hidden. Lines SHALL be expanded by default.

#### Scenario: Collapse a function
- **GIVEN** `Cartesian, two Y rails` is chosen
- **WHEN** the user collapses `Move the pen in XY`
- **THEN** its sub-functions are hidden and the line shows that 3 lines are hidden

### Requirement: Open node stays visible
When the open node would be hidden (under a collapsed line, or under a solution that is neither chosen nor peeked), the graph SHALL show the path to it, marked dormant where not chosen, without changing the stored collapse or peek state.

#### Scenario: Open a hidden function
- **GIVEN** nothing is chosen under `Move the pen in XY`
- **WHEN** the user opens `Keep the gantry square` from a link
- **THEN** the graph lists it, dormant, under `Move the pen in XY` and highlights it
