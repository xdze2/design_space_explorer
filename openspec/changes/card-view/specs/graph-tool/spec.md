# Spec Delta

## MODIFIED Requirements

### Requirement: Link editing
The tool SHALL add and remove links of the six types with `link` and `unlink` (`--how`, `--constrains`, `--requires`, `--excludes`, `--compatible-with`, `--fares`); `link --how` SHALL also accept `--order N` (an integer) to record the position of the new link among its parent's children, and `link --fares` SHALL require `--score N` (−2, −1, 1 or 2), which it records on the new `fares` links. `link --fares` on an existing `fares` link SHALL replace its score. Nodes SHALL be addressed by id or by an unambiguous id prefix; an ambiguous or unknown reference SHALL fail. Adding a link SHALL record a `src` (default `user`, settable), and refuse a duplicate, a type pair the format forbids, a `how` link that would create a cycle, and a `how` link that would mix function and solution targets under one function. Every write SHALL leave `links.jsonl` canonical.

#### Scenario: Add a second parent
- **WHEN** a `how` link is added to a function that already has one
- **THEN** the function has two incoming `how` links and the file stays sorted

#### Scenario: Cycle refused
- **GIVEN** A has a `how` path to B
- **WHEN** a `how` link from B to A is added
- **THEN** the tool fails, naming the cycle, and the file is unchanged

#### Scenario: Forbidden pair refused
- **WHEN** a `requires` link is added from a function
- **THEN** the tool fails naming the types and the file is unchanged

#### Scenario: Mixed children refused
- **GIVEN** a function with a `how` link to a solution
- **WHEN** a `how` link from it to another function is added
- **THEN** the tool fails and the file is unchanged

#### Scenario: Remove a link
- **WHEN** an existing link is removed
- **THEN** its line is gone and the other lines are unchanged

#### Scenario: Ambiguous prefix
- **WHEN** two node ids start with the given prefix
- **THEN** the tool fails listing the matching ids

#### Scenario: Link with an order
- **WHEN** `link P --how C --order 2` is run
- **THEN** the new line has `"order":2` between `type` and `src`

#### Scenario: Order without how
- **WHEN** `--order` is given and no `--how` link is requested
- **THEN** the tool fails and the file is unchanged

#### Scenario: Fares with a score
- **WHEN** `link <CoreXY> --fares <Budget> --score -1` is run
- **THEN** the new line is a `fares` link with `"score":-1` between `type` and `src`

#### Scenario: Fares without a score
- **WHEN** `--fares` is given without `--score`, or with `--score 0`
- **THEN** the tool fails and the file is unchanged

#### Scenario: Rescore
- **GIVEN** `CoreXY` fares −1 on `Budget`
- **WHEN** `link <CoreXY> --fares <Budget> --score -2` is run
- **THEN** the link's score is −2 and there is still one such line

### Requirement: Lint
The tool SHALL report, without modifying anything: `how` links implied by another path, nodes unreachable from the root, `requires` and `excludes` between the same pair, links whose `hint` is out of date, functions with mixed function and solution children, constraints with no `constrains` link, nodes whose `how` children are partly ordered (some links with `order`, some without), and solutions or components with no `summary`. It SHALL exit non-zero if it found anything, and print one line per finding.

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

#### Scenario: Clean graph
- **WHEN** lint runs on a graph with no findings
- **THEN** it prints nothing and exits with code 0

## ADDED Requirements

### Requirement: Summary at creation
`new` SHALL accept `--summary TEXT` and write it as the node's `summary` frontmatter field, refusing text with a line break or longer than 120 characters before writing anything.

#### Scenario: New node with a summary
- **WHEN** `new "Rack and pinion" --type solution --why <fn> --summary "A gear on a toothed rack"` is run
- **THEN** the new file's frontmatter has `summary: A gear on a toothed rack`

#### Scenario: Summary too long
- **WHEN** `--summary` is longer than 120 characters
- **THEN** the tool fails and writes nothing
