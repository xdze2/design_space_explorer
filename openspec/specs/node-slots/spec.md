# node-slots Specification

## Purpose
Lets nodes carry a group label so the viewer can arrange decisions into labelled areas of a diagram, without changing the tree structure.

## Requirements

### Requirement: Optional slot field
A node MAY have a `slot` field holding a non-empty string. The build SHALL copy it to `graph.json` unchanged and SHALL fail with a message naming the node when `slot` is present but is not a non-empty string. Nodes without `slot` SHALL build as before.

#### Scenario: Slot passed through
- **WHEN** `graph/gantry.md` has `slot: Motion`
- **THEN** the `gantry` node in `graph.json` has `slot` equal to `Motion`

#### Scenario: Invalid slot
- **WHEN** a node has `slot: [a, b]` or `slot: ""`
- **THEN** the build fails naming that node and writes no `graph.json`

#### Scenario: No slot
- **WHEN** a node has no `slot`
- **THEN** it builds without error and has no `slot` in `graph.json`

### Requirement: Demo graph slots
The demo decisions SHALL declare slots: `gantry`, `drive` and `linear-guide` in `Motion`, `pen-lift` in `Tool`, `controller` in `Electronics`.

#### Scenario: Demo slots
- **WHEN** the demo graph is built
- **THEN** each of the five decisions has the slot listed above
