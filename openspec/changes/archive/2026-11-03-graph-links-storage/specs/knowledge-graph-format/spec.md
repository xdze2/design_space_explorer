# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Single root and tree hierarchy`
- TO: `### Requirement: Single root and acyclic hierarchy`

## MODIFIED Requirements

### Requirement: Node file format
Each node SHALL be one Markdown file under `graph/`, with YAML frontmatter and a free-form Markdown body. The node id SHALL be the frontmatter `id`, 8 lowercase hexadecimal characters, unique in the graph. The file name and folder carry no meaning for the graph.

#### Scenario: Node id from path
- **WHEN** a file at `graph/gantry/corexy.md` has `id: 3fa91c0e` in its frontmatter
- **THEN** its node id is `3fa91c0e`

#### Scenario: Missing or malformed id
- **WHEN** a node has no `id`, or an `id` that is not 8 lowercase hexadecimal characters
- **THEN** the build fails and names the file

#### Scenario: Duplicate id
- **WHEN** two node files have the same `id`
- **THEN** the build fails and names both files

### Requirement: Frontmatter fields
Frontmatter SHALL contain `id`, `title`, `type` (one of `root`, `decision`, `option`, `component`) and a non-empty `sources` list of free-text strings. It MAY contain `confidence` (`low`, `medium` or `high`) and `slot`. It SHALL NOT contain `parent`, `requires`, `excludes` or `compatible_with`; those are links.

#### Scenario: Valid node
- **GIVEN** a node with id, title, type and sources `["user", "LLM:sonnet-5.5"]`
- **WHEN** the graph is built
- **THEN** the node is accepted

#### Scenario: Missing sources
- **WHEN** a node has no `sources` or an empty list
- **THEN** the build fails and names the offending node

#### Scenario: Link field in frontmatter
- **WHEN** a node's frontmatter has a `parent`, `requires`, `excludes` or `compatible_with` field
- **THEN** the build fails and names the node and the field

### Requirement: Single root and acyclic hierarchy
The graph SHALL contain exactly one node of type `root`. Every other node SHALL have at least one `parent` link and SHALL reach the root by following `parent` links, and `parent` links SHALL NOT form a cycle. A node MAY have several parents.

#### Scenario: Orphan node
- **WHEN** a non-root node has no `parent` link
- **THEN** the build fails and names the node

#### Scenario: Parent cycle
- **WHEN** following `parent` links from a node returns to that node
- **THEN** the build fails and names a node in the cycle

#### Scenario: Two parents
- **GIVEN** a node with `parent` links to two different decisions
- **WHEN** the graph is built
- **THEN** the build succeeds and the node appears in the `children` of both

### Requirement: Reference integrity
Every id used in a link, as `from` or `to`, SHALL refer to an existing node, and no link SHALL have the same node as both ends.

#### Scenario: Dangling reference
- **WHEN** a link has a `to` that matches no node
- **THEN** the build fails and reports the link line and the unknown id

#### Scenario: Self link
- **WHEN** a link has the same id as `from` and `to`
- **THEN** the build fails and reports the link line

### Requirement: Edge semantics
`requires` SHALL mean the target must also be selected when the source is selected. `excludes` SHALL mean the two nodes cannot be selected together, and SHALL be treated as symmetric. `compatible_with` SHALL be informational and SHALL NOT restrict selection. A `parent` link SHALL point from the child to its parent.

#### Scenario: Symmetric exclusion
- **GIVEN** an `excludes` link from A to B and none from B to A
- **WHEN** the graph is built
- **THEN** in the output both A and B list each other in `excludes`

### Requirement: Compiled graph output
The build SHALL write one `graph.json` containing every node with its id, frontmatter fields, Markdown body, derived `parents` and `children` lists, and `requires`, `excludes` and `compatible_with` lists, so that a consumer needs no other file to display the graph. It SHALL also set `parent` to the first parent of a non-root node. Lists SHALL be ordered deterministically: nodes by id, `children` by title, `parents` by link order in the links file.

#### Scenario: Successful build
- **WHEN** the build runs on a valid `graph/` folder
- **THEN** `graph.json` is written with one entry per node and the process exits with code 0

#### Scenario: Failed build
- **WHEN** any validation rule fails
- **THEN** all errors are printed, no `graph.json` is written or updated, and the process exits non-zero

#### Scenario: Parent for existing consumers
- **GIVEN** a node with two parent links
- **WHEN** the graph is built
- **THEN** its `parent` equals the first entry of its `parents`

## ADDED Requirements

### Requirement: Links file
All links SHALL be stored in `graph/links.jsonl`, one JSON object per line, with fields `from`, `to`, `type` (`parent`, `requires`, `excludes` or `compatible_with`) and `src` (a non-empty string, same convention as node `sources`), and MAY include `hint`. The build SHALL ignore `hint`. A missing file SHALL be treated as no links.

#### Scenario: Valid links file
- **GIVEN** a links file with a `parent` line and an `excludes` line, each with `src`
- **WHEN** the graph is built
- **THEN** both links appear in the output on the right nodes

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
The links file SHALL be canonical when its lines are sorted by `type`, `from`, `to`, with the keys in the order `from`, `to`, `type`, `src`, `hint` and no duplicate (`type`, `from`, `to`) triples. The build SHALL accept a non-canonical file that is otherwise valid.

#### Scenario: Unsorted file
- **WHEN** a valid links file has its lines in any order
- **THEN** the build succeeds and the output does not depend on the order, except for the order of `parents`

#### Scenario: Hint is ignored
- **WHEN** a link's `hint` text does not match the node titles
- **THEN** the build still succeeds
