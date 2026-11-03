# Spec Delta

## Purpose

A command-line tool, the single supported way to edit graph data. It creates nodes, adds and removes links, prints trees and checks graph hygiene, so that people and AI assistants never hand-edit the links file and every change shows up as a small, readable diff.

## ADDED Requirements

### Requirement: Node creation
The tool SHALL create a node file with a new id that is unique in the graph, the given title, type and sources, and an empty body, and print the id. The file SHALL be placed flat under `graph/` and named from the title, with a numeric suffix if the name is taken. A node of type other than `root` SHALL be given at least one parent at creation.

#### Scenario: New option under a decision
- **WHEN** the tool is run to create an option titled "Rack and pinion" under a given decision
- **THEN** `graph/rack-and-pinion.md` exists with a fresh `id`, and `links.jsonl` has a `parent` link from the new node to the decision

#### Scenario: Missing parent
- **WHEN** a non-root node is requested without a parent
- **THEN** the tool fails and writes nothing

#### Scenario: Unknown parent
- **WHEN** the given parent id is not a node
- **THEN** the tool fails naming the id and writes nothing

### Requirement: Link editing
The tool SHALL add and remove links of the four types. Nodes SHALL be addressed by id or by an unambiguous id prefix; an ambiguous or unknown reference SHALL fail. Adding a link SHALL record a `src` (default `user`, settable), refuse a duplicate, and refuse a `parent` link that would create a cycle. Every write SHALL leave `links.jsonl` canonical.

#### Scenario: Add a second parent
- **WHEN** a `parent` link is added from a node that already has one
- **THEN** the node has two `parent` links and the file stays sorted

#### Scenario: Cycle refused
- **GIVEN** A is a parent of B
- **WHEN** a `parent` link from A to B is added
- **THEN** the tool fails, naming the cycle, and the file is unchanged

#### Scenario: Remove a link
- **WHEN** an existing link is removed
- **THEN** its line is gone and the other lines are unchanged

#### Scenario: Ambiguous prefix
- **WHEN** two node ids start with the given prefix
- **THEN** the tool fails listing the matching ids

### Requirement: Readable hints
The tool SHALL write a `hint` on every link it writes, built from the node titles (for example `GT2 belt > Drive type`), and a `format` command SHALL rewrite the whole links file in canonical form with all hints refreshed from the current titles.

#### Scenario: Hint after retitle
- **GIVEN** a node was retitled in its file
- **WHEN** the format command runs
- **THEN** the hints of its links show the new title and nothing else changes

### Requirement: Tree listing
The tool SHALL print the hierarchy as an indented text outline, one node per line with its id and title, children ordered by title. A node with several parents SHALL be printed under each, and its children only under the first occurrence, the others marked as repeats.

#### Scenario: Two parents
- **GIVEN** a node with two parents
- **WHEN** the tree is printed
- **THEN** the node appears under both parents, and its children appear once

### Requirement: Lint
The tool SHALL report, without modifying anything: parent links that are redundant because another parent path already implies them, nodes with no parent, `requires` and `excludes` between the same pair, and links whose `hint` is out of date. It SHALL exit non-zero if it found anything, and print one line per finding.

#### Scenario: Redundant parent link
- **GIVEN** B is a child of A, C is a child of B, and C also has a direct `parent` link to A
- **WHEN** lint runs
- **THEN** the direct link C to A is reported as redundant

#### Scenario: Contradiction
- **WHEN** A requires B and A excludes B
- **THEN** lint reports the pair

#### Scenario: Clean graph
- **WHEN** lint runs on a graph with no findings
- **THEN** it prints nothing and exits with code 0
