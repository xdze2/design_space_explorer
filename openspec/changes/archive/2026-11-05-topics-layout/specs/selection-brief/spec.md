# Spec Delta

## MODIFIED Requirements

### Requirement: Brief cache
A brief SHALL be a Markdown file in the topic's `briefs/` folder (`topics/<topic>/briefs/`) whose frontmatter records the design id and name, a hash of the design content and of the chosen nodes' content, the model name and the prompt version. `briefs/index.json` in the same folder SHALL map each design id to its file. The repository SHALL provide a command that saves a brief from a Markdown file for an exported design file, for the topic given with `--topic` (default `pen_plotter`), and updates the index. The prompt template SHALL remain shared by all topics.

#### Scenario: Save a brief
- **WHEN** the save command is run with an exported design file and a Markdown file
- **THEN** `topics/pen_plotter/briefs/<design id>.md` exists with the frontmatter and the text, and the index maps the id to it

#### Scenario: Save replaces
- **WHEN** a brief is saved for a design that already has one
- **THEN** the file and the index entry are replaced, not duplicated

#### Scenario: Unknown id
- **WHEN** the design file names a node id that is not in the topic's `graph.json`
- **THEN** the command fails with a message naming the id and writes nothing

#### Scenario: Design of another topic
- **WHEN** the design file has a `topic` different from the one given
- **THEN** the command fails with a message naming both topics and writes nothing
