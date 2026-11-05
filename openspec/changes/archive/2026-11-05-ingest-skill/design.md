# Design

## Context

See proposal.md for the motivation and specs/ for the requirements. Current state that shapes the approach:

- Claude Code finds project skills only in `.claude/skills/<name>/SKILL.md`. It follows a relative symlink there (tested: a skill linked from `.claude/skills/x -> ../../skills/x` was listed and ran). `.claude/skills/` already holds the `openspec-*` skills, which `openspec update` regenerates.
- Format rules live in `README.md` (node format, links file, pictures, editing commands); `tools/graph.py` writes links and nodes; the build is the full validator.
- `tools/graph.py` reads frontmatter by line scan, only `id`, `title`, `type`, `summary`. It has no command to edit `sources`.
- `viewer/design.js` `clean(graph, raw)` already validates a design against a graph and returns what it dropped; `scripts/brief.mjs` uses it to refuse a bad design file. `toGraph` in `scripts/brief.mjs` turns `graph.json` into the graph shape it needs.
- `inbox.md` is at the root, untracked and not ignored; it holds one URL. Raw files are either summaries (`web - *.md`, with a header) or verbatim page dumps (the EasyDraw page).
- `card-view` and `topics-layout` are complete but not archived. Both touch specs this change modifies; the `graph-tool` Lint delta here is written on top of `card-view`'s version.

## Goals / Non-Goals

**Goals:**
- A skill short enough to be read in full at each run, that sends the agent to the README for format details.
- Mechanical checks (lint, tests) for the rules that can be checked, so the skill does not depend on the agent remembering them.
- Learn from one real run before writing more process.

**Non-Goals:**
- A generic skill framework, an install script, or tooling for skills beyond the link check.
- New `graph.py` commands (for example editing `sources`).

## Decisions

- **Skill layout.** `skills/ingest/SKILL.md` only, about 100 to 150 lines: when to use it, inputs (source, topic), the seven steps, then three short templates inline: the raw header, the plan, a product design file. Alternative: templates as separate files in the skill folder; rejected for now, one file is easier to read and revise after the first run. Frontmatter `description` names the triggers ("ingest", "add a source", "process the inbox", a product URL).
- **Link per skill, committed.** `.claude/skills/ingest -> ../../skills/ingest`. Alternative: link the whole `.claude/skills` to `skills/`; rejected, it would mix the generated OpenSpec skills into the project folder.
- **Repository checks in one test file.** New `test/repo.test.mjs` with two tests: skill links (read each `skills/*/SKILL.md` frontmatter with the `yaml` package, `realpath` of `.claude/skills/<name>` equals the folder) and committed designs (for each `topics/*/designs/*.design.json`: parse, `topic` equals the folder name, `clean(toGraph(graph.json), raw).dropped` empty). Alternative: a `check-design` CLI; rejected, the tests already run at the end of every ingestion and a CLI would be one more command to learn.
- **Lint raw citation.** `read_frontmatter` also captures the `sources` line and parses it as JSON (the tool writes it that way); a non-JSON value is ignored by this check (the build reports bad frontmatter). A value is a raw citation if it starts with `raw/` or contains `/raw/`. Link `src` gets the same test. Alternative: make it a build error; rejected, lint is where content rules live, and the build stays about structure.
- **Fixing the 24 nodes.** A one-off edit of their frontmatter (remove the `raw/DIY A3 pen plotter - Claude.md` entry), checked by the new lint rule. Hand-editing a node file is allowed; only `links.jsonl` is tool-only. No URL replaces it: the content came from that Claude chat, which `LLM:claude-sonnet` already records.
- **Design file content.** Product name as `name`, `intent` = one line on the product + its URL, `constraints` = values stated on the page keyed by constraint node id (prose, e.g. `"A3; A4 and A2 versions exist"`), `functions`: settled ones `decided` with `choice`, the others absent or `open` with a note "not stated on the product page". `id` is `d-` plus a slug-based 8-character hex, so re-ingesting keeps the same id. The design is written as JSON by the agent (no tool): it is small, and the test validates it.
- **Inbox.** Stays at the root, one line per item, an optional `topic:` prefix (default `pen_plotter`); committed so the queue is shared. A line is removed when its raw file exists.
- **Plan format.** A numbered list grouped by kind (new nodes, new links, edits, design file, nothing new), each item one line with the type, title, why and source. Numbers let the user approve part of it ("1-4 and 7").
- **First run as part of the change.** Task: run the skill on EasyDraw V4 with the user approving the plan, then revise `SKILL.md` from what was unclear. This is how the concepts get refined; the specs describe the outcome, not the exact skill text.

## Risks / Trade-offs

- [Symlinks on Windows or in some zip downloads become plain files] → solo Linux project; the link test makes it visible.
- [The skill text drifts from the README] → the skill links to README sections instead of copying rules; checkable rules live in lint and tests.
- [The product page does not say which layout or controller it uses] → those functions stay open with a note; the plan lists them as open questions.
- [The agent skips the approval step] → stated as a hard rule at the top of the skill; nothing in `knowledge_graph/` or `designs/` before an explicit yes.
- [Archive order] → archive `card-view`, then `topics-layout`, before this change, or its Lint delta replaces a requirement that changed underneath.

## Migration Plan

No data migration. The source fix and the new lint rule land together so lint stays clean. Rollback is `git revert`.

## Open concept questions from the first run (EasyDraw V4)

- **Environment-provided choices.** "Hold the drawing surface" lists a bed board, an open frame and a wall frame, but not whether the surface belongs to the machine or to its environment (the table holds the paper). A design may need "provided by the environment" as a choice of its own.
- **Sub-functions of a chosen solution** (the pen pressure under the servo pen lift) are settled by the product only in practice; the page is silent. Should a design carry them, or only top-level functions?
- **Scores for a lone component.** A `fares` link is relative to siblings; a component with no sibling (Delrin V-wheels) gets its tradeoffs in its body instead.
- **Prior citations.** Earlier runs cite a source in several nodes without a design file; the skill now checks for them before planning.
