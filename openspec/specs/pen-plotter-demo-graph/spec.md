# pen-plotter-demo-graph Specification

## Purpose
Provides a demo knowledge graph about designing a DIY pen plotter, used to validate the node format and to give later viewer and agent work real content to run against.

## Requirements

### Requirement: Node content quality
Each function and solution node's body SHALL state why it matters or why it would be chosen, and its tradeoffs. Every node SHALL cite at least one source, which MAY be `user` or `LLM:<model>` for unverified content.

#### Scenario: Source marking
- **WHEN** a node's content was written by an LLM and not checked against a real source
- **THEN** its `sources` includes `LLM:<model>` and its `confidence` is `low`

### Requirement: Cross-decision constraints
The demo graph SHALL include at least five `requires` or `excludes` edges between solutions of different functions, each explained in the body of the node that declares it.

#### Scenario: Incompatible pair
- **WHEN** two solutions of different functions are linked by `excludes`
- **THEN** the declaring node's body explains why they cannot be combined

### Requirement: Graph builds cleanly
The demo graph SHALL pass the build with no errors.

#### Scenario: Demo build
- **WHEN** the build runs on the demo `graph/` folder
- **THEN** it exits with code 0 and writes `graph.json`

### Requirement: Demo graph structure
The demo graph SHALL be a new FAST tree about a DIY pen plotter, authored from scratch with `tools/graph.py` (new generated ids, free titles and structure), and SHALL contain between 40 and 70 nodes. It SHALL have one main function, at least three first-level functions, and at least two solutions for each function whose how-targets are solutions. At least one function SHALL have alternative solutions at depth 2 or more under a solution, showing the AND/OR alternation (for example sub-functions brought by a gantry solution, each with its own solutions). At least one sub-function SHALL be shared by two solutions (several whys). At least one solution SHALL have component children. It SHALL build without error and pass `lint` with no finding.

#### Scenario: Coverage check
- **WHEN** the graph is built
- **THEN** it has exactly one root, at least three first-level functions, and each function whose how-targets are solutions has at least two

#### Scenario: Alternation under a solution
- **WHEN** a solution that brings sub-functions is looked up
- **THEN** its `how` list holds functions, and at least one of them has solutions of its own

#### Scenario: Shared sub-function
- **WHEN** the nodes are checked for whys
- **THEN** at least one function has two or more whys that are solutions

#### Scenario: Guide the axes under the gantry solutions
- **WHEN** the gantry solutions of the move-the-pen function are looked up
- **THEN** each of them has "Guide the axes" in its `how` list, and it is not a how-target of the main function

#### Scenario: Ordered
- **WHEN** the demo graph is linted
- **THEN** no node has partly ordered children, and the main function's `how` children are ordered

#### Scenario: Components
- **WHEN** the nodes are checked
- **THEN** at least one solution has a component among its how-targets

#### Scenario: Clean
- **WHEN** `npm run build` and `python3 tools/graph.py lint` are run
- **THEN** both succeed and lint prints nothing

### Requirement: Constraint nodes
The demo graph SHALL contain at least two constraint nodes, each with a `constrains` link to a function. Their bodies SHALL describe the kind of limit and how solutions are affected, and SHALL NOT state spec values such as a paper format or a price as targets.

#### Scenario: Constraints present
- **WHEN** the graph is built
- **THEN** at least two constraint nodes each have a `constrains` link to a function

#### Scenario: No target values
- **WHEN** the body of a constraint is read
- **THEN** it does not set a paper format such as "A3" or a dollar amount as the goal
