# Proposal

## Why

The next step is to grow the graph from real sources (web pages, product pages, chats), but how to do it exists only as habit: an inbox file, ad hoc summaries in `raw/`, conventions spread over the README and past commits. An agent doing it again has to guess, and the result drifts (24 nodes already cite a private `raw/` file that readers of the repo cannot open). Writing the process down as a committed skill, and trying it once on a real source, lets us use it and refine the concepts with it.

## What Changes

- A new `skills/` folder at the repo root for project skills, visible next to `prompts/`. Each skill is linked into `.claude/skills/<name>` with a relative symlink so Claude Code loads it; a test fails if a link is missing.
- A first skill, `skills/ingest/SKILL.md`, describing how to ingest one source into a topic:
  1. collect: an inbox item or a URL becomes `topics/<topic>/raw/<name>.md` with a header (date, source URLs); a summary or a verbatim copy are both fine;
  2. classify: a **topic source** (talks about options) or a **product page** (one machine that made its choices);
  3. map the source onto the current tree;
  4. show the planned changes and wait for the user's go;
  5. apply only with `tools/graph.py`, following the README format and a body template;
  6. for a product page, also write one design file `topics/<topic>/designs/<slug>.design.json` with the product's choices;
  7. run lint, build and tests, and report. The skill never commits.
  It points to the README and the tool for format rules instead of repeating them.
- Citation rule: a node's `sources` and a link's `src` hold public URLs, `user` or `LLM:<model>`, never a `raw/` path. `graph.py lint` reports any `raw/` citation. The 24 nodes citing `raw/DIY A3 pen plotter - Claude.md` drop that entry (they already cite `LLM:claude-sonnet`).
- Committed design files in `topics/<topic>/designs/` are checked by the tests: each must fit its topic's graph with nothing dropped.
- First run of the skill on the EasyDraw V4 product page from `inbox.md`: its design file, any graph changes it shows are needed, and edits to the skill from what the run teaches.

Out of scope: listing, switching or comparing designs in the viewer (the design library), automatic fetching or scheduled ingestion, a skill for anything other than ingestion, ingesting the other `raw/` files.

## Capabilities

### New Capabilities

- `project-skills`: where project skills live, how Claude Code finds them, and the check that keeps the links in place.
- `source-ingestion`: the ingestion process the skill defines: raw file, classification, confirmed plan, graph edits, product design files, checks and report.

### Modified Capabilities

- `graph-tool`: lint also reports `sources` or `src` entries that point into `raw/`.
- `pen-plotter-demo-graph`: node content cites public sources only; the topic holds at least one product design that fits the graph.

## Impact

- New: `skills/ingest/SKILL.md`, `.claude/skills/ingest` (symlink), `topics/pen_plotter/designs/easydraw-v4.design.json`, a raw file for EasyDraw (git-ignored).
- Code: `tools/graph.py` (lint), `tools/test_graph.py`, a test in `test/` for skill links and design files.
- Content: `sources` of 24 nodes in `topics/pen_plotter/knowledge_graph/`, possibly new nodes from the EasyDraw run; `inbox.md`.
- Docs: `README.md` (skills folder, citation rule, designs folder).
- Depends on `card-view` and `topics-layout` being archived first (both modify the same specs).
