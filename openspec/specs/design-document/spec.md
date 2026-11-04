# design-document Specification

## Purpose
The user's design as a persistent object, separate from navigation: one JSON document holding the choices, shortlists, rejections, notes and constraint values, edited only by explicit actions, saved in the browser and portable as a file.

## Requirements

### Requirement: Design document shape
The design SHALL be one JSON object with a `format` version, an `id`, a `name`, an `intent` (prose), `constraints` (constraint node id → prose value) and `functions` (function id → entry). An entry SHALL hold `status` (`open`, `exploring` or `decided`), `choice` (a solution id or null), `shortlist` (solution ids), `rejected` (list of solution id with a `reason`) and `notes` (prose).

#### Scenario: New design
- **WHEN** the viewer is opened for the first time
- **THEN** a design exists with a fresh id, a default name, empty intent, no constraint values and no function entries

#### Scenario: Function without an entry
- **WHEN** a function has no entry in the design
- **THEN** it is treated as `open`, with no choice, empty shortlist, nothing rejected and no notes

### Requirement: Solutions belong to their function
A solution SHALL be chosen, shortlisted or rejected only under a function it is a how-target of. A function SHALL have at most one choice, and a solution SHALL NOT be at the same time the choice and rejected, nor shortlisted and rejected.

#### Scenario: Wrong function
- **WHEN** a design entry for `Lift and lower the pen` names `CoreXY` as its choice
- **THEN** the choice is dropped when the design is loaded, with a visible notice

### Requirement: Edit actions
The design SHALL change only through these actions: Choose a solution, Unchoose, Shortlist or Unshortlist a solution, Reject a solution with a non-empty reason, Unreject, set a function's notes, set a constraint value, set the name and the intent, start a New design, and Undo. Opening, collapsing or peeking nodes SHALL NOT change the design.

#### Scenario: Navigation does not edit
- **GIVEN** a design with `CoreXY` chosen
- **WHEN** the user opens other nodes, collapses lines and peeks solutions
- **THEN** the design is unchanged

#### Scenario: Reject needs a reason
- **WHEN** the user rejects `Solenoid pen lift` with an empty reason
- **THEN** the design is unchanged and the reason field asks for text

### Requirement: Choose and status
Choosing a solution SHALL make it the function's choice (replacing a previous one, which goes back to the shortlist), remove it from the rejected list, and set the status to `decided`. Unchoosing SHALL clear the choice and set the status to `exploring` if the shortlist is not empty, `open` otherwise. Shortlisting under a function with no choice SHALL set the status to `exploring`.

#### Scenario: Choose
- **WHEN** the user chooses `CoreXY`
- **THEN** `Move the pen in XY` is `decided` with choice `CoreXY`

#### Scenario: Replace a choice
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user chooses `Single-rail cantilever`
- **THEN** the choice is `Single-rail cantilever` and `CoreXY` is in the shortlist

#### Scenario: Shortlist while open
- **WHEN** the user shortlists `FluidNC on ESP32` under an open `Turn G-code into motion`
- **THEN** the function is `exploring` with that solution in its shortlist

#### Scenario: Unchoose
- **GIVEN** `Move the pen in XY` is decided with an empty shortlist
- **WHEN** the user unchooses its solution
- **THEN** the function is `open` with no choice

### Requirement: Excluded and required solutions
A solution SHALL be excluded when it has an `excludes` link with a chosen solution of an active function, and required when a chosen solution of an active function `requires` it and it is not chosen. Choosing an excluded solution SHALL be allowed and SHALL produce a conflict, not be blocked. Only direct links SHALL be considered.

#### Scenario: Excluded
- **GIVEN** `CoreXY` is chosen
- **THEN** `Leadscrew drive` is excluded by `CoreXY` and `GT2 belt drive` is required by `CoreXY`

#### Scenario: Choosing an excluded solution
- **GIVEN** `CoreXY` is chosen
- **WHEN** the user chooses `Leadscrew drive`
- **THEN** both are chosen and the design reports a conflict between them

### Requirement: Active part of the design
A function SHALL be active when it is the root, a how-target of an active function, or a how-target of the choice of an active function. Choices, conflicts, requirements and the undecided count SHALL consider active functions only; entries of inactive functions SHALL be kept, not deleted.

#### Scenario: Dormant entry kept
- **GIVEN** `Cartesian, two Y rails` is chosen and `Keep the gantry square` is decided
- **WHEN** the user chooses `CoreXY` instead
- **THEN** `Keep the gantry square` is inactive, its entry is kept, and its choice no longer counts in conflicts or requirements

#### Scenario: Back again
- **GIVEN** the previous scenario
- **WHEN** the user chooses `Cartesian, two Y rails` again
- **THEN** `Keep the gantry square` is active and decided as before

### Requirement: Design problems
The design SHALL report as problems: conflicts (two chosen active solutions linked by `excludes`), and missing requirements (a solution required and not chosen). Undecided functions are active functions with solution how-targets and no choice; they SHALL be counted but are not problems.

#### Scenario: Counts
- **WHEN** only `CoreXY` is chosen
- **THEN** there is 1 problem (`GT2 belt drive` missing) and every other active function with solutions is undecided

### Requirement: Browser storage
The design SHALL be saved in browser storage after every action and restored when the viewer is opened, with the same cleaning as an import (unknown ids and invalid entries dropped with a notice). If storage is unavailable or holds an unreadable value, the viewer SHALL work with a fresh design in memory and show a notice that it will not be kept.

#### Scenario: Reload keeps the design
- **GIVEN** `CoreXY` chosen and a note on `Move the pen in XY`
- **WHEN** the page is reloaded
- **THEN** the same design is shown

#### Scenario: Storage blocked
- **WHEN** browser storage throws on access
- **THEN** the page renders with a fresh design and a notice

### Requirement: Undo
Every action SHALL be undoable, most recent first, back to the state when the page was opened. Undo SHALL also be saved to storage. The undo history SHALL NOT be kept across reloads.

#### Scenario: Undo a choice
- **GIVEN** `CoreXY` was chosen, then `GT2 belt drive`
- **WHEN** the user presses Undo twice
- **THEN** neither is chosen

#### Scenario: Undo a new design
- **GIVEN** a design with choices
- **WHEN** the user starts a New design and then presses Undo
- **THEN** the previous design is back

### Requirement: Export and import
The user SHALL be able to export the design as a JSON file named from the design name, and import such a file to replace the current design (undoable). Import SHALL reject a file that is not JSON or has no `functions` object, leaving the design unchanged. Unknown node ids and invalid entries SHALL be dropped with a notice naming them.

#### Scenario: Round trip
- **WHEN** a design is exported and the file imported again
- **THEN** the design is the same

#### Scenario: Bad file
- **WHEN** the user imports a text file that is not JSON
- **THEN** an error is shown and the design is unchanged

#### Scenario: Unknown ids
- **WHEN** an imported design has an entry for a function id not in the graph
- **THEN** that entry is dropped and the notice names the id
