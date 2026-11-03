# Spec Delta

## Purpose

Provides a demo knowledge graph about designing a DIY pen plotter, used to validate the node format and to give later viewer and agent work real content to run against.

## ADDED Requirements

### Requirement: Demo graph size and coverage
The demo graph SHALL contain between 15 and 25 nodes, with one `root` node and decision nodes for at least: gantry geometry, linear guide, drive type, pen lift, and controller. Each decision SHALL have at least two option nodes.

#### Scenario: Coverage check
- **WHEN** the graph is built
- **THEN** the root has at least five decision children, and each decision has at least two option children

### Requirement: Node content quality
Each decision and option node's body SHALL state why it matters or why it would be chosen, and its tradeoffs. Each option SHALL cite at least one source, which MAY be `user` or `LLM:<model>` for unverified content.

#### Scenario: Source marking
- **WHEN** a node's content was written by an LLM and not checked against a real source
- **THEN** its `sources` includes `LLM:<model>` and its `confidence` is `low`

### Requirement: Cross-decision constraints
The demo graph SHALL include at least five `requires` or `excludes` edges between options of different decisions, each explained in the body of the node that declares it.

#### Scenario: Incompatible pair
- **WHEN** two options of different decisions are linked by `excludes`
- **THEN** the declaring node's body explains why they cannot be combined

### Requirement: Graph builds cleanly
The demo graph SHALL pass the build with no errors.

#### Scenario: Demo build
- **WHEN** the build runs on the demo `graph/` folder
- **THEN** it exits with code 0 and writes `graph.json`
