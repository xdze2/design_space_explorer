# Spec Delta

## MODIFIED Requirements

### Requirement: Design document shape
The design SHALL be one JSON object with a `format` version, an `id`, a `name`, an optional `topic` (the name of the topic whose graph it is made on), an `intent` (prose), `constraints` (constraint node id → prose value) and `functions` (function id → entry). An entry SHALL hold `status` (`open`, `exploring` or `decided`), `choice` (a solution id or null), `shortlist` (solution ids), `rejected` (list of solution id with a `reason`) and `notes` (prose). A design without `topic` SHALL be treated as belonging to the topic being viewed.

#### Scenario: New design
- **WHEN** the viewer is opened for the first time on the `pen_plotter` topic
- **THEN** a design exists with a fresh id, a default name, `topic` `pen_plotter`, empty intent, no constraint values and no function entries

#### Scenario: Function without an entry
- **WHEN** a function has no entry in the design
- **THEN** it is treated as `open`, with no choice, empty shortlist, nothing rejected and no notes

#### Scenario: Design without a topic
- **WHEN** a design file has no `topic`
- **THEN** it loads as a design of the topic being viewed

### Requirement: Browser storage
The design SHALL be saved in browser storage after every action, under a key specific to the topic, and restored when the viewer is opened on that topic, with the same cleaning as an import (unknown ids and invalid entries dropped with a notice). For `pen_plotter` only, a design found under the earlier single key SHALL be restored when the topic's own key is empty, and then saved under the topic's key. If storage is unavailable or holds an unreadable value, the viewer SHALL work with a fresh design in memory and show a notice that it will not be kept.

#### Scenario: Reload keeps the design
- **GIVEN** `CoreXY` chosen and a note on `Move the pen in XY`
- **WHEN** the page is reloaded
- **THEN** the same design is shown

#### Scenario: Topics keep separate designs
- **GIVEN** a design saved for `pen_plotter`
- **WHEN** the viewer is opened with `?topic=other`
- **THEN** a fresh design is shown, and the `pen_plotter` design is still there when that topic is opened again

#### Scenario: Earlier storage key
- **GIVEN** a design under the earlier single key and nothing under the `pen_plotter` key
- **WHEN** the viewer is opened on `pen_plotter`
- **THEN** that design is shown and saved under the topic's key

#### Scenario: Storage blocked
- **WHEN** browser storage throws on access
- **THEN** the page renders with a fresh design and a notice

### Requirement: Export and import
The user SHALL be able to export the design as a JSON file named from the design name, including its `topic`, and import such a file to replace the current design (undoable). Import SHALL reject a file that is not JSON, has no `functions` object, or names a `topic` other than the one being viewed, leaving the design unchanged. Unknown node ids and invalid entries SHALL be dropped with a notice naming them.

#### Scenario: Round trip
- **WHEN** a design is exported and the file imported again
- **THEN** the design is the same

#### Scenario: Bad file
- **WHEN** the user imports a text file that is not JSON
- **THEN** an error is shown and the design is unchanged

#### Scenario: Other topic
- **WHEN** the user imports a design whose `topic` is not the one being viewed
- **THEN** an error naming both topics is shown and the design is unchanged

#### Scenario: Unknown ids
- **WHEN** an imported design has an entry for a function id not in the graph
- **THEN** that entry is dropped and the notice names the id
