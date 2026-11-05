# Spec Delta

## ADDED Requirements

### Requirement: Card data in the demo
Every solution and component of the demo graph SHALL have a `summary`. Every solution SHALL have between one and four `fares` links, each to a constraint that bears on the solution's function or one of its ancestors, chosen for the tradeoffs its body already describes, with the reason stated in the body. The `fares` links SHALL use `src` `LLM:<model>` when written by an LLM.

#### Scenario: Summaries everywhere
- **WHEN** `python3 tools/graph.py lint` is run on the demo graph
- **THEN** it reports no missing summary

#### Scenario: Badges match the prose
- **GIVEN** the body of `Leadscrew drive` says it is slow
- **WHEN** its `fares` links are read
- **THEN** it fares negatively on `Drawing speed`

### Requirement: Pilot pictures
Each solution of "Move the pen in XY" SHALL have a picture in `graph/img/`: a monochrome line drawing of its kinematics in one shared style (same view box, stroke width and grey, no text and no fill colour other than that grey). Other nodes MAY have none.

#### Scenario: Pilot set
- **WHEN** the cards of "Move the pen in XY" are shown
- **THEN** every card shows a picture and none shows an abbreviation tile

#### Scenario: Shared style
- **WHEN** the pilot SVG files are compared
- **THEN** they share the same `viewBox` and stroke width and contain no `<text>` element
