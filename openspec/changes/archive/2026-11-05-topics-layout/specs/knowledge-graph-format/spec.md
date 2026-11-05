# Spec Delta

## MODIFIED Requirements

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
