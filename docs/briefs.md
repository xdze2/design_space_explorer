# Briefs

The viewer makes no LLM calls. A written brief for a design comes from an AI outside the page:

1. Build a design, expand "Prompt for an AI brief" in the overview and press "Copy prompt".
2. Paste it into any AI and save its answer as a Markdown file, e.g. `brief.md`.
3. Press **Export** and store the brief for that design file: `npm run brief -- save my-plotter.design.json brief.md --model <model name>` (add `--topic <name>` for another topic; a design file naming a different topic is refused).

Reload the page: the brief is shown in the overview with the model name.

## Cache layout

`topics/<topic>/briefs/<design id>.md` (frontmatter `design_id`, `design_name`, `content_hash`, `model`, `prompt_version`, `created`, then the Markdown) and `topics/<topic>/briefs/index.json` mapping each design id to its file. The brief stays attached to the design while you edit it; saving again for the same design replaces it. `save` fails, and writes nothing, if the design file names a node that is not in the topic's `graph.json` or holds an entry that does not fit it. The prompt template is `prompts/brief.md`.

## Stale briefs

A brief is marked **stale** when the design changed after it was saved (a choice, shortlist, rejection, note, constraint value, name or intent), or when the title, body, sources, `requires` or `excludes` of a chosen node changed. Opening, collapsing and peeking never make it stale. The prompt box is then shown again so a new brief can be made. A New design has no brief.
