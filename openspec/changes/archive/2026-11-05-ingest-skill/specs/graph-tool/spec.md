# Spec Delta

## MODIFIED Requirements

### Requirement: Lint
The tool SHALL report, without modifying anything: `how` links implied by another path, nodes unreachable from the root, `requires` and `excludes` between the same pair, links whose `hint` is out of date, functions with mixed function and solution children, constraints with no `constrains` link, nodes whose `how` children are partly ordered (some links with `order`, some without), solutions or components with no `summary`, and node `sources` or link `src` that cite a `raw/` path (a value starting with `raw/` or containing `/raw/`). It SHALL exit non-zero if it found anything, and print one line per finding.

#### Scenario: Redundant parent link
- **GIVEN** B is a how-child of A, C is a how-child of B, and C also has a direct `how` link from A
- **WHEN** lint runs
- **THEN** the direct link A to C is reported as implied

#### Scenario: Contradiction
- **WHEN** A requires B and A excludes B
- **THEN** lint reports the pair

#### Scenario: Constraint without target
- **WHEN** a constraint has no `constrains` link
- **THEN** lint reports the constraint

#### Scenario: Unreachable node
- **WHEN** a solution cannot reach the root by following `how` links backwards
- **THEN** lint reports the node

#### Scenario: Partly ordered children
- **GIVEN** a node with three `how` links of which one has an `order`
- **WHEN** lint runs
- **THEN** lint reports the node

#### Scenario: Missing summary
- **WHEN** a solution has no `summary`
- **THEN** lint reports the node

#### Scenario: Raw citation
- **WHEN** a node has `sources: ["raw/notes.md", "user"]`, or a link has `src` `topics/pen_plotter/raw/notes.md`
- **THEN** lint reports the node or the link and the cited path

#### Scenario: Clean graph
- **WHEN** lint runs on a graph with no findings
- **THEN** it prints nothing and exits with code 0
