# Spec Delta

## MODIFIED Requirements

### Requirement: Node content quality
Each function and solution node's body SHALL state why it matters or why it would be chosen, and its tradeoffs. Every node SHALL cite at least one source, which MAY be `user` or `LLM:<model>` for unverified content. Sources SHALL be public (a URL, `user` or `LLM:<model>`); no node SHALL cite a file in `raw/`.

#### Scenario: Source marking
- **WHEN** a node's content was written by an LLM and not checked against a real source
- **THEN** its `sources` includes `LLM:<model>` and its `confidence` is `low`

#### Scenario: No private source
- **WHEN** `graph.py lint` runs on the `pen_plotter` topic
- **THEN** it reports no `raw/` citation

## ADDED Requirements

### Requirement: Product designs
The `pen_plotter` topic SHALL hold at least one design of an existing product in `topics/pen_plotter/designs/`, starting with the EasyDraw V4, that fits the topic's graph.

#### Scenario: EasyDraw design present
- **WHEN** the tests run
- **THEN** `topics/pen_plotter/designs/easydraw-v4.design.json` is checked and passes
