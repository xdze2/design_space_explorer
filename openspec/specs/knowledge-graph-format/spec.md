# knowledge-graph-format Specification

## Purpose
Defines how design knowledge is stored as Markdown nodes with structured frontmatter, and how a folder of nodes is validated and compiled into a single graph file for downstream tools such as a viewer.

## Requirements

### Requirement: Node file format
Each node SHALL be one Markdown file under `graph/`, with YAML frontmatter and a free-form Markdown body. The node id SHALL be the file path relative to `graph/`, without the `.md` extension.

#### Scenario: Node id from path
- **WHEN** a file exists at `graph/gantry/corexy.md`
- **THEN** its node id is `gantry/corexy`

### Requirement: Frontmatter fields
Frontmatter SHALL contain `title`, `type` (one of `root`, `decision`, `option`, `component`) and a non-empty `sources` list of free-text strings. It MAY contain `parent`, `requires`, `excludes`, `compatible_with` (lists of node ids) and `confidence` (`low`, `medium` or `high`). All non-root nodes SHALL have a `parent`.

#### Scenario: Valid node
- **GIVEN** a node with title, type, parent and sources `["user", "LLM:sonnet-5.5"]`
- **WHEN** the graph is built
- **THEN** the node is accepted

#### Scenario: Missing sources
- **WHEN** a node has no `sources` or an empty list
- **THEN** the build fails and names the offending node

### Requirement: Single root and tree hierarchy
The graph SHALL contain exactly one node of type `root`, and every other node SHALL reach it by following `parent` links without cycles.

#### Scenario: Orphan node
- **WHEN** a non-root node has no `parent`
- **THEN** the build fails and names the node

#### Scenario: Parent cycle
- **WHEN** following `parent` links from a node returns to that node
- **THEN** the build fails and names a node in the cycle

### Requirement: Reference integrity
Every id used in `parent`, `requires`, `excludes` and `compatible_with` SHALL refer to an existing node.

#### Scenario: Dangling reference
- **WHEN** a node lists `excludes: [gantry/doesnotexist]`
- **THEN** the build fails and reports the node and the unknown id

### Requirement: Edge semantics
`requires` SHALL mean the listed nodes must also be selected when this node is selected. `excludes` SHALL mean the listed nodes cannot be selected together with this node, and SHALL be treated as symmetric. `compatible_with` SHALL be informational and SHALL NOT restrict selection.

#### Scenario: Symmetric exclusion
- **GIVEN** node A lists B in `excludes` and B does not list A
- **WHEN** the graph is built
- **THEN** in the output both A and B list each other in `excludes`

### Requirement: Compiled graph output
The build SHALL write one `graph.json` containing every node with its id, frontmatter fields, derived `children` list and Markdown body, so that a consumer needs no other file to display the graph.

#### Scenario: Successful build
- **WHEN** the build runs on a valid `graph/` folder
- **THEN** `graph.json` is written with one entry per node and the process exits with code 0

#### Scenario: Failed build
- **WHEN** any validation rule fails
- **THEN** all errors are printed, no `graph.json` is written or updated, and the process exits non-zero

### Requirement: Raw data excluded from version control
A `raw/` folder for source material SHALL be git-ignored, and the build SHALL NOT read from it.

#### Scenario: Raw folder ignored
- **WHEN** files are added to `raw/`
- **THEN** git does not list them as untracked
