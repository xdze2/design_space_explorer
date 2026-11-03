# Spec Delta

## MODIFIED Requirements

### Requirement: Demo graph size and coverage
The demo graph SHALL contain between 15 and 25 nodes, with one `root` node and decision nodes for at least: gantry geometry, linear guide, drive type, pen lift, and controller. Each decision SHALL have at least two option nodes. The demo SHALL be stored in the current format, with ids in the frontmatter and all links in `links.jsonl`, and SHALL have the same nodes and links as before the format change.

#### Scenario: Coverage check
- **WHEN** the graph is built
- **THEN** the root has at least five decision children, and each decision has at least two option children

#### Scenario: Format migration keeps content
- **GIVEN** the demo graph before and after the format change
- **WHEN** nodes are compared by title
- **THEN** the titles, types, slots, bodies, parents, `requires`, `excludes` and `compatible_with` relations are identical
