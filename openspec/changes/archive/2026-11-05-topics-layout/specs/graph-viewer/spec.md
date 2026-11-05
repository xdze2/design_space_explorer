# Spec Delta

## MODIFIED Requirements

### Requirement: Static loading
The viewer SHALL be plain static files that load the compiled graph of one topic, `topics/<topic>/graph.json`, over HTTP and need no build step beyond producing it. The topic SHALL come from the `topic` query parameter of the page URL, default `pen_plotter`; a name that does not follow the topic name rules SHALL be refused. Pictures and cached briefs SHALL be loaded from the same topic folder. If `graph.json` cannot be loaded or is malformed, the page SHALL show an error message instead of an empty page.

#### Scenario: Graph loads
- **WHEN** the page is opened from a static server next to a valid `topics/pen_plotter/graph.json`
- **THEN** the graph panel shows the root function and its how-children

#### Scenario: Other topic
- **WHEN** the page is opened with `?topic=other` and `topics/other/graph.json` is valid
- **THEN** the graph of that topic is shown

#### Scenario: Graph missing
- **WHEN** `graph.json` returns an error or invalid JSON, or the topic does not exist
- **THEN** the page shows a message naming the problem

#### Scenario: Invalid topic name
- **WHEN** the page is opened with `?topic=../x`
- **THEN** the page shows an error about the topic name and fetches nothing

### Requirement: Local serving
The repository SHALL provide a single command that serves the viewer and the topics' files locally. It SHALL NOT serve any topic's `raw/` folder.

#### Scenario: Serve
- **WHEN** the serve command is run
- **THEN** it prints a local URL at which the viewer loads the current `topics/pen_plotter/graph.json`

#### Scenario: Raw is private
- **WHEN** a file under `topics/pen_plotter/raw/` is requested
- **THEN** the server answers 403
