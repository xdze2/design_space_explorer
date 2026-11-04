# knowledge-graph-format Specification

## Purpose
Defines how design knowledge is stored as Markdown nodes with structured frontmatter, and how a folder of nodes is validated and compiled into a single graph file for downstream tools such as a viewer.

## Requirements

### Requirement: Node file format
Each node SHALL be one Markdown file directly under `graph/`, with YAML frontmatter and a free-form Markdown body. The node id SHALL be the frontmatter `id`, 8 lowercase hexadecimal characters, unique in the graph. The file name carries no meaning for the graph.

#### Scenario: Node id from path
- **WHEN** a file at `graph/corexy.md` has `id: 3fa91c0e` in its frontmatter
- **THEN** its node id is `3fa91c0e`

#### Scenario: Missing or malformed id
- **WHEN** a node has no `id`, or an `id` that is not 8 lowercase hexadecimal characters
- **THEN** the build fails and names the file

#### Scenario: Duplicate id
- **WHEN** two node files have the same `id`
- **THEN** the build fails and names both files

#### Scenario: Node file in a subfolder
- **WHEN** a `.md` file is found in a subfolder of `graph/`
- **THEN** the build fails and names the file

### Requirement: Frontmatter fields
Frontmatter SHALL contain `id`, `title`, `type` (one of `function`, `solution`, `component`, `constraint`) and a non-empty `sources` list of free-text strings. It MAY contain `confidence` (`low`, `medium` or `high`). It SHALL NOT contain `slot`, `parent`, `requires`, `excludes` or `compatible_with`; links live in the links file.

#### Scenario: Valid node
- **GIVEN** a node with id, title, type and sources `["user", "LLM:sonnet-5.5"]`
- **WHEN** the graph is built
- **THEN** the node is accepted

#### Scenario: Missing sources
- **WHEN** a node has no `sources` or an empty list
- **THEN** the build fails and names the offending node

#### Scenario: Old type
- **WHEN** a node has type `root`, `decision` or `option`
- **THEN** the build fails and names the node and the type

#### Scenario: Link field in frontmatter
- **WHEN** a node's frontmatter has a `slot`, `parent`, `requires`, `excludes` or `compatible_with` field
- **THEN** the build fails and names the node and the field

### Requirement: Single root and acyclic hierarchy
The graph SHALL contain exactly one root: the only `function` node with no incoming `how` link. Every `function`, `solution` and `component` node SHALL reach the root by following `how` links backwards, and `how` links SHALL NOT form a cycle. A node MAY have several whys.

#### Scenario: Orphan node
- **WHEN** a function, solution or component cannot reach the root by following `how` links backwards
- **THEN** the build fails and names the node

#### Scenario: Two roots
- **WHEN** two function nodes have no incoming `how` link
- **THEN** the build fails and names both

#### Scenario: Parent cycle
- **WHEN** following `how` links from a node returns to that node
- **THEN** the build fails and names a node in the cycle

#### Scenario: Two parents
- **GIVEN** a function with `how` links coming from two different solutions
- **WHEN** the graph is built
- **THEN** the build succeeds and the function lists both in its `why`

### Requirement: Reference integrity
Every id used in a link, as `from` or `to`, SHALL refer to an existing node, and no link SHALL have the same node as both ends.

#### Scenario: Dangling reference
- **WHEN** a link has a `to` that matches no node
- **THEN** the build fails and reports the link line and the unknown id

#### Scenario: Self link
- **WHEN** a link has the same id as `from` and `to`
- **THEN** the build fails and reports the link line

### Requirement: Edge semantics
`how` SHALL point from the why end to the how end. By the node types it joins: function to function is a sub-function (AND), function to solution is an alternative (OR), solution to function is a sub-function the solution brings (AND), solution to component is a part. `constrains` SHALL point from a constraint to a function and mean the constraint limits the choices under that function. `requires` SHALL mean the target must also be selected when the source is selected. `excludes` SHALL mean the two nodes cannot be selected together, and SHALL be treated as symmetric. `compatible_with` SHALL be informational and SHALL NOT restrict selection.

#### Scenario: Symmetric exclusion
- **GIVEN** an `excludes` link from A to B and none from B to A
- **WHEN** the graph is built
- **THEN** in the output both A and B list each other in `excludes`

### Requirement: Compiled graph output
The build SHALL write one `graph.json` with a top-level `root` id and every node with its id, frontmatter fields, Markdown body, `why` (in links-file order) and `how` (sorted by the links' `order`) id lists, `constrains` and `constrained_by` lists, and `requires`, `excludes` and `compatible_with` lists, so that a consumer needs no other file to display the graph. Nodes SHALL NOT have `parent`, `parents`, `children` or `slot`. Nodes SHALL be ordered by id.

#### Scenario: Successful build
- **WHEN** the build runs on a valid `graph/` folder
- **THEN** `graph.json` is written with the `root` id and one entry per node, and the process exits with code 0

#### Scenario: Failed build
- **WHEN** any validation rule fails
- **THEN** all errors are printed, no `graph.json` is written or updated, and the process exits non-zero

#### Scenario: Parent for existing consumers
- **GIVEN** a function F with `how` links F to S1 and F to S2, without `order`, and S2 has the title that sorts first
- **WHEN** the graph is built
- **THEN** F's `how` is `[S2, S1]` and each of S1 and S2 has F in its `why`

#### Scenario: Author order
- **GIVEN** a function F with `how` links to S1 (`order` 2), S2 (`order` 1) and S3 (no `order`), in any file order
- **WHEN** the graph is built
- **THEN** F's `how` is `[S2, S1, S3]`

### Requirement: Raw data excluded from version control
A `raw/` folder for source material SHALL be git-ignored, and the build SHALL NOT read from it.

#### Scenario: Raw folder ignored
- **WHEN** files are added to `raw/`
- **THEN** git does not list them as untracked

### Requirement: Links file
All links SHALL be stored in `graph/links.jsonl`, one JSON object per line, with fields `from`, `to`, `type` (`how`, `constrains`, `requires`, `excludes` or `compatible_with`) and `src` (a non-empty string, same convention as node `sources`), and MAY include `hint`. A `how` link MAY also include `order`, an integer giving the position of the target among the `how` targets of the source (per source node); no other link type SHALL have `order`. The build SHALL ignore `hint`. A missing file SHALL be treated as no links. A `parent` link SHALL be rejected.

#### Scenario: Valid links file
- **GIVEN** a links file with a `how` line and an `excludes` line, each with `src`
- **WHEN** the graph is built
- **THEN** both links appear in the output on the right nodes

#### Scenario: Old parent link
- **WHEN** a line has `type: "parent"`
- **THEN** the build fails and names the line number

#### Scenario: Order not an integer
- **WHEN** a `how` line has an `order` that is not an integer
- **THEN** the build fails and names the line number

#### Scenario: Order on another link type
- **WHEN** a line of type `requires`, `excludes`, `compatible_with` or `constrains` has an `order`
- **THEN** the build fails and names the line number

### Requirement: Links file validation
The build SHALL reject a malformed line, an unknown `type`, a missing `src` or a duplicate link, naming the line number.

#### Scenario: Malformed line
- **WHEN** a line is not valid JSON or lacks `from`, `to`, `type` or `src`
- **THEN** the build fails and names the line number

#### Scenario: Unknown link type
- **WHEN** a link has `type: "related"`
- **THEN** the build fails and names the line number and the type

#### Scenario: Duplicate link
- **WHEN** two lines have the same `type`, `from` and `to`
- **THEN** the build fails and names both line numbers

### Requirement: Canonical links file
The links file SHALL be canonical when its lines are sorted by `type`, `from`, `to`, with the keys in the order `from`, `to`, `type`, `order`, `src`, `hint` and no duplicate (`type`, `from`, `to`) triples. The build SHALL accept a non-canonical file that is otherwise valid.

#### Scenario: Unsorted file
- **WHEN** a valid links file has its lines in any order
- **THEN** the build succeeds and the output does not depend on the order, except for the order of `why`

#### Scenario: Hint is ignored
- **WHEN** a link's `hint` text does not match the node titles
- **THEN** the build still succeeds

### Requirement: Link type pairs
A `how` link SHALL join one of: function to function, function to solution, solution to function, solution to component. A `constrains` link SHALL join a constraint to a function. `requires`, `excludes` and `compatible_with` SHALL join only solution and component nodes. Constraint nodes SHALL have no `how` link. A function's `how` targets SHALL be all functions or all solutions, never a mix.

#### Scenario: Forbidden pair
- **WHEN** a `how` link goes from a component to a function
- **THEN** the build fails and reports the link line and the two types

#### Scenario: Constraint with a how link
- **WHEN** a `how` link has a constraint as either end
- **THEN** the build fails and reports the link line

#### Scenario: Mixed children
- **WHEN** a function has a `how` link to a function and another to a solution
- **THEN** the build fails and names the function

#### Scenario: Requires on a function
- **WHEN** a `requires` link has a function as an end
- **THEN** the build fails and reports the link line
