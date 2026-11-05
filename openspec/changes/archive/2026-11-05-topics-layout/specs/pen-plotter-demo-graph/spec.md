# Spec Delta

## MODIFIED Requirements

### Requirement: Graph builds cleanly
The demo graph SHALL be the `pen_plotter` topic (`topics/pen_plotter/knowledge_graph/`) and SHALL pass the build with no errors.

#### Scenario: Demo build
- **WHEN** the build runs on the `pen_plotter` topic
- **THEN** it exits with code 0 and writes `topics/pen_plotter/graph.json`
