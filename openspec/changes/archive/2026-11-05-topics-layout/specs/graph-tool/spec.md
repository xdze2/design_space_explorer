# Spec Delta

## MODIFIED Requirements

### Requirement: Node creation
The tool SHALL work on one topic's knowledge graph, chosen with `--topic <name>` (default `pen_plotter`, same name rules as the build). It SHALL create a node file with a new id that is unique in the graph, the given title, type (`function`, `solution`, `component` or `constraint`) and sources, and an empty body, and print the id. The file SHALL be placed flat under `topics/<topic>/knowledge_graph/` and named from the title, with a numeric suffix if the name is taken. Every node except a constraint SHALL be given a why (`--why <id>`), which creates the `how` link from that node to the new one. A constraint SHALL be given `--constrains <id>` instead. A function with no why SHALL be accepted only if the graph has no root yet.

#### Scenario: New option under a decision
- **WHEN** the tool is run to create a solution titled "Rack and pinion" with `--why` a function
- **THEN** `topics/pen_plotter/knowledge_graph/rack-and-pinion.md` exists with a fresh `id`, and `links.jsonl` in the same folder has a `how` link from the function to the new node

#### Scenario: Other topic
- **WHEN** the tool is run with `--topic other` on a solution
- **THEN** the file is written under `topics/other/knowledge_graph/` and the `pen_plotter` topic is untouched

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
