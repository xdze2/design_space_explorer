# Design

## Context

`scripts/build-graph.mjs` (Node, `yaml` package) walks `graph/`, derives each id from the file path, reads `parent`, `requires`, `excludes` and `compatible_with` from the frontmatter, validates, and writes `graph.json` with a derived `children` list. The viewer uses `parent` (one option per decision in `select.js`, the diagram, node view labels) and `children`, and ids appear in URL hashes and in brief keys (`briefs/index.json`). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Several parents per node, with no change to what the viewer shows today.
- Links that diff cleanly, carry provenance, and can only be written in canonical form.
- One editing tool that keeps nodes and links consistent.

**Non-Goals:**
- A new view, new selection rules for multi-parent nodes, `children_mode`, tags.
- A second validator with full parity in Python (see below).

## Decisions

**Ids are 8 hex characters in the frontmatter; files are free-form.** Random ids are stable under rename and move, which is the point of the change; 8 hex (32 bits) is plenty for a few thousand nodes and the tool checks for collisions at creation. The build checks the format and uniqueness. New files are created flat as `graph/<slug>.md`; existing files keep their path at migration so git follows the history.
*Alternatives:* slugs as ids (readable but break on rename, and the folder keeps meaning something); full UUIDs (long to type in URLs, hashes and prompts, no benefit at this size).

**`graph/links.jsonl`, one edge per line.**
```
{"from":"a1b2c3d4","to":"d4e5f6a7","type":"parent","src":"LLM:sonnet-5.5","hint":"GT2 belt > Drive type"}
```
Fixed key order, compact separators, sorted by (`type`, `from`, `to`), so an added edge is one added line and merges rarely conflict. `src` mirrors node `sources` (free text) and is the provenance an assistant leaves behind. `hint` is for people reading `git diff`; only the tool writes it and the build ignores it. Edge direction is the node that owns the statement: `parent` goes child to parent, `requires` and `excludes` are stored once, in the direction they were stated, and `excludes` is made symmetric by the build as today.
*Alternatives:* keep links in frontmatter with ids (no provenance per link, and a multi-parent list inside every file); a single `graph.json`-like file (unreadable diffs).

**Build stays Node and stays authoritative.** It reads the links file, validates (format, uniqueness, references, no self link, no cycle among `parent` edges, reachability, exactly one root), and compiles. For compatibility it keeps `parent` = first entry of `parents`, where `parents` follows the order of the `parent` lines in the (sorted) file; the file order is deterministic, so the primary parent is too. `children` are sorted by title (ids are random, so id order would look arbitrary; the old order was by path, which was also alphabetical by title in practice for the demo). Cycle detection moves from "follow one parent" to a DFS over all parent edges.

**The tool is Python, standard library only.** `tools/graph.py` (argparse subcommands: `new`, `link`, `unlink`, `tree`, `format`, `lint`). It parses node frontmatter only as far as it needs (`id`, `title`) with a small line scanner and writes new nodes from a template, so it needs no YAML library. It refuses edits that would break an invariant it can check cheaply (unknown id, duplicate, cycle, missing parent) and leaves the full rule set to the build; `lint` holds the advisory rules the build does not enforce (transitive redundancy, `requires` with `excludes` on the same pair, stale hints, parentless nodes). Two languages is a cost, accepted because the user wants a Python "database interface"; the shared contract is the file format, covered by tests on both sides (Python tests write files the Node build must accept). A command `npm run graph -- <args>` is not added: Python is optional for people who only build or view.
*Alternative:* a Node tool beside the build (one language, shared validator). Rejected as the stated preference is Python, but it remains the fallback if the validator drift becomes a problem.

**Node references by id or unique prefix.** On the command line, `link a1b2 --parent d4e5` is enough; ambiguity is an error that lists candidates. Titles are not accepted: they change.

**Transitive redundancy is advisory.** If A > B > C and C also has a direct `parent` to A, the direct link adds nothing; the tool reports it but does not delete, because an assistant or person may add it deliberately while restructuring.

**Migration is one-off and kept out of the repo.** A throwaway script, run once, assigns an id to each existing file, moves `parent` (and the three other fields) into `links.jsonl` with `src: "migration"` and writes hints. It is not committed; the result is. The migration is checked by building the old graph first and comparing the old and new `graph.json` by title (same nodes, bodies and relations), as the demo-graph spec requires.

**Briefs for old ids go stale.** Brief keys and `pick` values are ids, so `briefs/02216aef876fcc.md` no longer matches any selection. The selection-brief behavior for a missing brief already applies (no brief shown, prompt offered). The old file is deleted with the migration, and the new graph can regenerate it.

## Risks / Trade-offs

- [Validator drift between Python and Node] → the Python tool only prevents cheap mistakes and the build is the last word; tests create graphs with the tool and build them.
- [Opaque ids hurt reading the links file] → `hint`, `tree` and the viewer; the links file is not meant to be read raw.
- [Hand edits to `links.jsonl` break canonical form] → the build only requires valid lines and no duplicates, not sort order; `format` fixes the rest.
- [Multi-parent nodes behave oddly in selection and the diagram, which use `parent`] → out of scope here; they use the first parent until the outline-view change and selection rules are designed. The demo stays single-parent.
- [Children now sorted by title may reorder siblings in the viewer] → accepted and checked in the viewer tests.

## Migration Plan

1. Run the one-off migration on `graph/`; build; compare old and new `graph.json` by title.
2. Delete the stale brief and its index entry; rebuild.
3. Rollback is `git revert`: no data lives outside the repository.
