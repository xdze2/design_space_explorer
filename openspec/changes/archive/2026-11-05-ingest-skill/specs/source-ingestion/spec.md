# Spec Delta

## Purpose

Defines how an agent turns one source (a web page, a product page, a chat) into changes to a topic's knowledge graph and design files, so that every ingestion follows the same steps and leaves the graph valid and properly sourced.

## ADDED Requirements

### Requirement: Ingestion skill
The repository SHALL provide a project skill `ingest` that takes a source (a URL, an item of `inbox.md`, or a file already in the topic's `raw/`) and a topic (default `pen_plotter`) and carries out the steps of this capability in order. It SHALL refer to `README.md` and `tools/graph.py` for the format rules rather than restate them.

#### Scenario: Invoked on an inbox item
- **WHEN** the user runs `/ingest` with the EasyDraw V4 URL from `inbox.md`
- **THEN** the agent follows the steps: raw file, classification, mapping, plan, edits after approval, checks, report

### Requirement: Raw file
Each ingested source SHALL have a file in `topics/<topic>/raw/` that starts with a header giving its title, the date it was collected and the source URLs. Its body MAY be a summary or a verbatim copy. When the source came from `inbox.md`, its line SHALL be removed from the inbox once the raw file exists.

#### Scenario: New URL
- **WHEN** a URL is ingested that has no raw file yet
- **THEN** a raw file exists with the header, and the URL is no longer in `inbox.md`

#### Scenario: Existing raw file
- **WHEN** the source is a file already in `raw/` without the header
- **THEN** the header is added before anything else is done

### Requirement: Source classification
The agent SHALL classify the source as a **topic source** (it discusses options, tradeoffs or parts) or a **product page** (it describes one existing machine and the choices it made), state the class in the plan, and treat a source that is both as a product page.

#### Scenario: Product page
- **WHEN** the source is the EasyDraw V4 shop page
- **THEN** the plan names it a product page

### Requirement: Confirmed plan
Before writing to the knowledge graph or to `designs/`, the agent SHALL show the user a plan listing, for each finding, the change it makes (new node with type and why, new link, edited body or summary, new design file) or that it adds nothing new, and SHALL write nothing until the user approves. The user MAY approve part of the plan.

#### Scenario: Nothing written before approval
- **WHEN** the plan is shown and the user has not answered
- **THEN** `knowledge_graph/` and `designs/` are unchanged

#### Scenario: Partial approval
- **WHEN** the user approves only some items
- **THEN** only those items are applied

### Requirement: Graph edits
Graph changes SHALL be made with `tools/graph.py` only (never by editing `links.jsonl` by hand) and SHALL reuse an existing node rather than create a near-duplicate. A new solution or component SHALL have a `summary` and a body stating why it would be chosen, its tradeoffs and the reason for each of its links; a `fares` score SHALL compare the node with its siblings under the same function.

#### Scenario: Known option
- **WHEN** the source describes an option already in the graph
- **THEN** the existing node is cited or extended, and no new node is created for it

### Requirement: Citations
Every node source and link `src` written by ingestion SHALL be a public URL, `user` or `LLM:<model>`, never a path into `raw/`. Content written by an LLM and not checked against the cited source SHALL have `confidence: low`.

#### Scenario: Web source
- **WHEN** a node is created from a page whose raw file is in `raw/`
- **THEN** its `sources` holds the page's URL, not the raw file path

### Requirement: Product design file
For a product page the agent SHALL write `topics/<topic>/designs/<slug>.design.json` in the exported design format, with the topic, the product name, an intent giving its description and URL, constraint values the page states (such as format or price), and every function the page settles marked `decided` with the product's solution as choice. A function the page does not settle SHALL stay open, with a note saying it is unknown.

#### Scenario: EasyDraw design
- **WHEN** the EasyDraw V4 page is ingested
- **THEN** `topics/pen_plotter/designs/easydraw-v4.design.json` exists, names the product, and its decided functions hold solutions of the graph

#### Scenario: Missing option
- **WHEN** the product uses a solution the graph does not have
- **THEN** the plan proposes the new node, and the design chooses it once it exists

### Requirement: Committed designs fit the graph
The test suite SHALL check every `topics/<topic>/designs/*.design.json`: it SHALL be valid JSON whose `topic` is that topic and which loads against the topic's `graph.json` with nothing dropped, and a failure SHALL name the file and what does not fit.

#### Scenario: Unknown id in a design
- **WHEN** a committed design chooses an id that is not in its topic's graph
- **THEN** a test fails naming the file and the id

### Requirement: Checks and report
After applying, the agent SHALL run `python3 tools/graph.py lint`, `npm run build` and `npm test`, fix what they report, and end with a report of the nodes, links and design files changed and any open question. It SHALL NOT commit.

#### Scenario: Clean run
- **WHEN** the edits are applied
- **THEN** lint has no finding, the build and tests pass, the report lists the changes, and `git log` is unchanged
