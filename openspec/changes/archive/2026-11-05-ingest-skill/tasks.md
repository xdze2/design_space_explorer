# Tasks

## 1. Citation rule

- [x] 1.1 `tools/graph.py`: `read_frontmatter` also reads `sources` (JSON list); `lint` reports node `sources` and link `src` values that start with `raw/` or contain `/raw/`, naming the node or link and the path. Add tests in `tools/test_graph.py` (node source, link src, clean case). Verify: `python3 -m unittest discover tools` passes.
- [x] 1.2 Remove `"raw/DIY A3 pen plotter - Claude.md"` from the `sources` of the 24 `pen_plotter` nodes. Verify: `python3 tools/graph.py lint` has no finding, `npm run build` passes.
- [x] 1.3 README: state the citation rule (public URL, `user`, `LLM:<model>`, never `raw/`) next to the `sources` field and in the lint list. Verify: the README lint list matches the tool.

## 2. Skills folder

- [x] 2.1 Create `skills/ingest/SKILL.md` (frontmatter `name: ingest`, trigger description) with the steps, the hard approval rule, and the raw header, plan and product design templates, linking to README sections for format rules (design.md, Decisions). Verify: every step of the `source-ingestion` spec appears in it.
- [x] 2.2 Add the committed relative link `.claude/skills/ingest -> ../../skills/ingest`. Verify: `readlink` shows the relative target, `claude -p "/ingest"` with no source makes the skill ask for one.
- [x] 2.3 `test/repo.test.mjs`: skill link test (each `skills/*/SKILL.md` has a matching `name` and a link resolving to its folder). Verify: `npm test` passes, and fails naming the skill when the link is removed temporarily.
- [x] 2.4 `test/repo.test.mjs`: committed designs test (each `topics/*/designs/*.design.json` parses, has its folder's `topic`, and `clean` drops nothing). Verify: passes with no designs; a temporary design with an unknown id fails naming the file and the id.
- [x] 2.5 README: a short "Skills" section (the `skills/` folder, the link convention, `/ingest`, `inbox.md` with the optional `topic:` prefix) and `designs/` described as product and user design files checked by the tests. Verify: the README layout list includes `skills/` and `inbox.md`.

## 3. First run: EasyDraw V4

- [x] 3.1 Run `/ingest` on the EasyDraw V4 inbox item: header on its raw file, classified as a product page, plan shown and approved by the user. Verify: nothing under `knowledge_graph/` or `designs/` changed before the approval.
- [x] 3.2 Apply the approved plan: graph edits with `tools/graph.py`, `topics/pen_plotter/designs/easydraw-v4.design.json`, inbox line removed. Verify: lint clean, `npm run build` and `npm test` pass (the design test now checks the EasyDraw file), the design imports in the viewer.
- [x] 3.3 Revise `skills/ingest/SKILL.md` from what the run showed was unclear or missing, and list in the change's design.md any concept question it raised for the design library. Verify: the user reviews the diff of `SKILL.md`.

## Workflow follow-up

- Archive `card-view`, then `topics-layout`, before archiving this change.
