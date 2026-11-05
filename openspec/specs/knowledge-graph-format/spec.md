# knowledge-graph-format Specification

## Purpose
Defines how design knowledge is stored as Markdown nodes with structured frontmatter, and how a folder of nodes is validated and compiled into a single graph file for downstream tools such as a viewer.

## Requirements

### Requirement: Node file format
Each node SHALL be one Markdown file directly under the topic's `knowledge_graph/` folder (`topics/<topic>/knowledge_graph/`), with YAML frontmatter and a free-form Markdown body. The node id SHALL be the frontmatter `id`, 8 lowercase hexadecimal characters, unique in the graph. The file name carries no meaning for the graph.

#### Scenario: Node id from path
- **WHEN** a file at `topics/pen_plotter/knowledge_graph/corexy.md` has `id: 3fa91c0e` in its frontmatter
- **THEN** its node id is `3fa91c0e`

#### Scenario: Missing or malformed id
- **WHEN** a node has no `id`, or an `id` that is not 8 lowercase hexadecimal characters
- **THEN** the build fails and names the file

#### Scenario: Duplicate id
- **WHEN** two node files have the same `id`
- **THEN** the build fails and names both files

#### Scenario: Node file in a subfolder
- **WHEN** a `.md` file is found in a subfolder of `knowledge_graph/` (other than `img/`, which holds pictures only)
- **THEN** the build fails and names the file

### Requirement: Frontmatter fields
Frontmatter SHALL contain `id`, `title`, `type` (one of `function`, `solution`, `component`, `constraint`) and a non-empty `sources` list of free-text strings. It MAY contain `confidence` (`low`, `medium` or `high`), `summary` (a single-line string of at most 120 characters saying what the node is) and `abbr` (1 to 4 characters, letters and digits only, the label of the node's picture tile). It SHALL NOT contain `slot`, `parent`, `requires`, `excludes` or `compatible_with`; links live in the links file.

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

#### Scenario: Summary and abbr
- **GIVEN** a node with `summary: Two fixed motors and crossed belts move a light gantry` and `abbr: XY`
- **WHEN** the graph is built
- **THEN** the node is accepted and both fields are in `graph.json`

#### Scenario: Bad summary
- **WHEN** a node's `summary` contains a line break or is longer than 120 characters
- **THEN** the build fails and names the node

#### Scenario: Bad abbr
- **WHEN** a node's `abbr` is `GT-2` or longer than 4 characters
- **THEN** the build fails and names the node

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
`how` SHALL point from the why end to the how end. By the node types it joins: function to function is a sub-function (AND), function to solution is an alternative (OR), solution to function is a sub-function the solution brings (AND), solution to component is a part. `constrains` SHALL point from a constraint to a function and mean the constraint limits the choices under that function. `requires` SHALL mean the target must also be selected when the source is selected. `excludes` SHALL mean the two nodes cannot be selected together, and SHALL be treated as symmetric. `compatible_with` SHALL be informational and SHALL NOT restrict selection. `fares` SHALL point from a solution or component to a constraint and mean how well the source does against that constraint, by its `score`; it SHALL be informational and SHALL NOT restrict selection.

#### Scenario: Symmetric exclusion
- **GIVEN** an `excludes` link from A to B and none from B to A
- **WHEN** the graph is built
- **THEN** in the output both A and B list each other in `excludes`

#### Scenario: Fares is informational
- **GIVEN** `CoreXY` fares −2 on `Budget`
- **WHEN** `CoreXY` is chosen
- **THEN** the design reports no problem caused by that link

### Requirement: Compiled graph output
The build SHALL take a topic name (default `pen_plotter`) and write `topics/<topic>/graph.json` from `topics/<topic>/knowledge_graph/`. A topic name SHALL consist of lowercase letters, digits, `_` and `-` and start with a letter or digit; any other name SHALL be refused. The file SHALL have a top-level `root` id and every node with its id, frontmatter fields, Markdown body, `why` (in links-file order) and `how` (sorted by the links' `order`) id lists, `constrains` and `constrained_by` lists, and `requires`, `excludes` and `compatible_with` lists, a `fares` list of `{ "id", "score" }` objects sorted by id, and `img` set to `true` when the node has a picture, so that a consumer needs no other file to display the graph. Nodes SHALL NOT have `parent`, `parents`, `children` or `slot`. Nodes SHALL be ordered by id.

#### Scenario: Successful build
- **WHEN** the build runs on a topic with a valid `knowledge_graph/` folder
- **THEN** `topics/<topic>/graph.json` is written with the `root` id and one entry per node, and the process exits with code 0

#### Scenario: Failed build
- **WHEN** any validation rule fails
- **THEN** all errors are printed, no `graph.json` is written or updated, and the process exits non-zero

#### Scenario: Invalid topic name
- **WHEN** the build is run with a topic such as `../x` or `A b`
- **THEN** it fails with a message about the topic name and writes nothing

#### Scenario: Fares in the output
- **GIVEN** a `fares` link from `CoreXY` to `Budget` with score −1
- **WHEN** the graph is built
- **THEN** `CoreXY` has `fares: [{ "id": <Budget id>, "score": -1 }]` and `Budget` is unchanged apart from that

#### Scenario: Picture flag
- **GIVEN** `topics/<topic>/knowledge_graph/img/<CoreXY id>.svg` exists
- **WHEN** the graph is built
- **THEN** `CoreXY` has `img: true` and nodes without a picture have no `img` field

#### Scenario: Parent for existing consumers
- **GIVEN** a function F with `how` links F to S1 and F to S2, without `order`, and S2 has the title that sorts first
- **WHEN** the graph is built
- **THEN** F's `how` is `[S2, S1]` and each of S1 and S2 has F in its `why`

#### Scenario: Author order
- **GIVEN** a function F with `how` links to S1 (`order` 2), S2 (`order` 1) and S3 (no `order`), in any file order
- **WHEN** the graph is built
- **THEN** F's `how` is `[S2, S1, S3]`

### Requirement: Raw data excluded from version control
A `raw/` folder in each topic (`topics/<topic>/raw/`) for source material SHALL be git-ignored, and the build SHALL NOT read from it. The topic's `knowledge_graph/`, `graph.json`, `designs/` and `briefs/` SHALL NOT be ignored.

#### Scenario: Raw folder ignored
- **WHEN** files are added to `topics/pen_plotter/raw/`
- **THEN** git does not list them as untracked

#### Scenario: Other topic files tracked
- **WHEN** a file is added to `topics/pen_plotter/designs/`
- **THEN** git lists it as untracked, not ignored

### Requirement: Links file
All links SHALL be stored in `topics/<topic>/knowledge_graph/links.jsonl`, one JSON object per line, with fields `from`, `to`, `type` (`how`, `constrains`, `requires`, `excludes`, `compatible_with` or `fares`) and `src` (a non-empty string, same convention as node `sources`), and MAY include `hint`. A `how` link MAY also include `order`, an integer giving the position of the target among the `how` targets of the source (per source node); no other link type SHALL have `order`. A `fares` link SHALL include `score`, one of the integers −2, −1, 1, 2; no other link type SHALL have `score`. The build SHALL ignore `hint`. A missing file SHALL be treated as no links. A `parent` link SHALL be rejected.

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
- **WHEN** a line of type `requires`, `excludes`, `compatible_with`, `constrains` or `fares` has an `order`
- **THEN** the build fails and names the line number

#### Scenario: Bad score
- **WHEN** a `fares` line has no `score`, or a `score` of 0, 3 or 1.5
- **THEN** the build fails and names the line number

#### Scenario: Score on another link type
- **WHEN** a `how` line has a `score`
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
The links file SHALL be canonical when its lines are sorted by `type`, `from`, `to`, with the keys in the order `from`, `to`, `type`, `order`, `score`, `src`, `hint` and no duplicate (`type`, `from`, `to`) triples. The build SHALL accept a non-canonical file that is otherwise valid.

#### Scenario: Unsorted file
- **WHEN** a valid links file has its lines in any order
- **THEN** the build succeeds and the output does not depend on the order, except for the order of `why`

#### Scenario: Hint is ignored
- **WHEN** a link's `hint` text does not match the node titles
- **THEN** the build still succeeds

### Requirement: Link type pairs
A `how` link SHALL join one of: function to function, function to solution, solution to function, solution to component. A `constrains` link SHALL join a constraint to a function. `requires`, `excludes` and `compatible_with` SHALL join only solution and component nodes. A `fares` link SHALL join a solution or component to a constraint. Constraint nodes SHALL have no `how` link. A function's `how` targets SHALL be all functions or all solutions, never a mix.

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

#### Scenario: Fares to a function
- **WHEN** a `fares` link goes from a solution to a function
- **THEN** the build fails and reports the link line and the two types

### Requirement: Node pictures
A node MAY have a picture: an SVG file at `graph/img/<id>.svg`, a monochrome line drawing. The build SHALL fail when a file in `graph/img/` is not named after an existing node id with the `.svg` extension, or is larger than 50 kB. The build SHALL NOT read or change the picture content beyond its size.

#### Scenario: Picture for an unknown id
- **WHEN** `graph/img/deadbeef.svg` exists and no node has id `deadbeef`
- **THEN** the build fails and names the file

#### Scenario: Wrong format
- **WHEN** `graph/img/<CoreXY id>.png` exists
- **THEN** the build fails and names the file

#### Scenario: No picture folder
- **WHEN** `graph/img/` does not exist
- **THEN** the build succeeds and no node has `img`
