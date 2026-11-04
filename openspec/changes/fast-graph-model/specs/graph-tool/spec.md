## MODIFIED Requirements

### Requirement: Node creation
The tool SHALL create a node file with a new id that is unique in the graph, the given title, type (`function`, `solution`, `component` or `constraint`) and sources, and an empty body, and print the id. The file SHALL be placed flat under `graph/` and named from the title, with a numeric suffix if the name is taken. Every node except a constraint SHALL be given a why (`--why <id>`), which creates the `how` link from that node to the new one. A constraint SHALL be given `--constrains <id>` instead. A function with no why SHALL be accepted only if the graph has no root yet.

#### Scenario: New option under a decision
- **WHEN** the tool is run to create a solution titled "Rack and pinion" with `--why` a function
- **THEN** `graph/rack-and-pinion.md` exists with a fresh `id`, and `links.jsonl` has a `how` link from the function to the new node

#### Scenario: Missing parent
- **WHEN** a non-constraint node is requested without a why, and the graph already has a root
- **THEN** the tool fails and writes nothing

#### Scenario: First function
- **WHEN** a function is created without a why in a graph with no nodes
- **THEN** the node is created and becomes the root

#### Scenario: New constraint
- **WHEN** a constraint is created with `--constrains` a function
- **THEN** the file exists and `links.jsonl` has a `constrains` link from the constraint to the function

#### Scenario: Forbidden pair at creation
- **WHEN** the requested type and why would make a `how` link not allowed (for example a component under a function)
- **THEN** the tool fails naming the two types and writes nothing

#### Scenario: Unknown parent
- **WHEN** the given why id is not a node
- **THEN** the tool fails naming the id and writes nothing

### Requirement: Link editing
The tool SHALL add and remove links of the five types with `link` and `unlink` (`--how`, `--constrains`, `--requires`, `--excludes`, `--compatible-with`); `link --how` SHALL also accept `--order N` (an integer) to record the position of the new link among its parent's children. Nodes SHALL be addressed by id or by an unambiguous id prefix; an ambiguous or unknown reference SHALL fail. Adding a link SHALL record a `src` (default `user`, settable), and refuse a duplicate, a type pair the format forbids, a `how` link that would create a cycle, and a `how` link that would mix function and solution targets under one function. Every write SHALL leave `links.jsonl` canonical.

#### Scenario: Add a second parent
- **WHEN** a `how` link is added to a function that already has one
- **THEN** the function has two incoming `how` links and the file stays sorted

#### Scenario: Cycle refused
- **GIVEN** A has a `how` path to B
- **WHEN** a `how` link from B to A is added
- **THEN** the tool fails, naming the cycle, and the file is unchanged

#### Scenario: Forbidden pair refused
- **WHEN** a `requires` link is added from a function
- **THEN** the tool fails naming the types and the file is unchanged

#### Scenario: Mixed children refused
- **GIVEN** a function with a `how` link to a solution
- **WHEN** a `how` link from it to another function is added
- **THEN** the tool fails and the file is unchanged

#### Scenario: Remove a link
- **WHEN** an existing link is removed
- **THEN** its line is gone and the other lines are unchanged

#### Scenario: Ambiguous prefix
- **WHEN** two node ids start with the given prefix
- **THEN** the tool fails listing the matching ids

#### Scenario: Link with an order
- **WHEN** `link P --how C --order 2` is run
- **THEN** the new line has `"order":2` between `type` and `src`

#### Scenario: Order without how
- **WHEN** `--order` is given and no `--how` link is requested
- **THEN** the tool fails and the file is unchanged

### Requirement: Tree listing
The tool SHALL print the `how` tree from the root as an indented text outline, one node per line with its id and title, children in the order of the parent's `how` list (author order, then title for links without `order`). Children of a function SHALL be labelled as alternatives (OR) when they are solutions, or sub-functions (AND) when they are functions. A node reached by several whys SHALL be printed under each, and its children only under the first occurrence, the others marked as repeats.

#### Scenario: Two parents
- **GIVEN** a function with two whys
- **WHEN** the tree is printed
- **THEN** the function appears under both, and its children appear once

#### Scenario: Author order
- **GIVEN** a function whose how-links have `order` 2 and 1 on children titled "A" and "B" respectively
- **WHEN** the tree is printed
- **THEN** "B" is printed before "A"

#### Scenario: Labels
- **GIVEN** a function with two solutions as how-targets
- **WHEN** the tree is printed
- **THEN** the solutions are labelled as alternatives (OR)

### Requirement: Lint
The tool SHALL report, without modifying anything: `how` links implied by another path, nodes unreachable from the root, `requires` and `excludes` between the same pair, links whose `hint` is out of date, functions with mixed function and solution children, constraints with no `constrains` link, and nodes whose `how` children are partly ordered (some links with `order`, some without). It SHALL exit non-zero if it found anything, and print one line per finding.

#### Scenario: Redundant parent link
- **GIVEN** B is a how-child of A, C is a how-child of B, and C also has a direct `how` link from A
- **WHEN** lint runs
- **THEN** the direct link A to C is reported as implied

#### Scenario: Contradiction
- **WHEN** A requires B and A excludes B
- **THEN** lint reports the pair

#### Scenario: Constraint without target
- **WHEN** a constraint has no `constrains` link
- **THEN** lint reports the constraint

#### Scenario: Unreachable node
- **WHEN** a solution cannot reach the root by following `how` links backwards
- **THEN** lint reports the node

#### Scenario: Partly ordered children
- **GIVEN** a node with three `how` links of which one has an `order`
- **WHEN** lint runs
- **THEN** lint reports the node

#### Scenario: Clean graph
- **WHEN** lint runs on a graph with no findings
- **THEN** it prints nothing and exits with code 0

## ADDED Requirements

### Requirement: Child ordering
The tool SHALL provide `order <parent> <child> <child> ...`, which sets `order` 1 to n on the `how` links from the parent to the listed children, in the given order. Every listed node SHALL be an existing `how` child of the parent, with no repeat; otherwise the tool SHALL fail and write nothing. `how` links from the parent to unlisted children SHALL lose their `order`. The command SHALL leave `links.jsonl` canonical with hints refreshed, and SHALL NOT change links of other parents.

#### Scenario: Set an order
- **GIVEN** a parent with children A, B and C
- **WHEN** `order <parent> C A` is run
- **THEN** the links to C and A have `order` 1 and 2, the link to B has none, and the file is canonical

#### Scenario: Not a child
- **WHEN** a listed node is not a `how` child of the parent
- **THEN** the tool fails naming the node and the file is unchanged

#### Scenario: Reordering replaces
- **GIVEN** children already ordered A, B
- **WHEN** `order <parent> B A` is run
- **THEN** B has `order` 1 and A has `order` 2

#### Scenario: Order is per parent
- **GIVEN** a function with two whys
- **WHEN** the order is set under one why
- **THEN** its link under the other why is unchanged
