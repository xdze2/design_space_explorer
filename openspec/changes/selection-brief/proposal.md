# Proposal

## Why

The Selection page (see the `selection-page` change) summarizes a selection mechanically. A useful design brief, written in prose about this particular combination (tradeoffs, what to do about the conflicts, what to decide next), needs an AI. The static viewer must make no runtime LLM calls, so the writing happens offline and the viewer has to (a) hand the person a ready prompt and (b) show an already generated brief when there is one.

## What Changes

- Add a prompt template `prompts/brief.md` and a pure function that fills it from a selection: selected nodes (title, body, sources), conflicts, missing requirements and undecided decisions.
- The Selection page shows that prompt in a collapsible box with a "Copy prompt" button.
- Add a cache of briefs: `briefs/<key>.md` (Markdown with frontmatter: `pick`, node-content hash, model, prompt version) and `briefs/index.json` mapping selection keys to files. The key is a hash of the sorted `pick` list, so order does not matter.
- The Selection page, for the current selection, shows the cached brief above the deterministic summary; a brief whose node-content hash no longer matches the graph is shown marked "stale"; with no brief, the prompt box is shown.
- Add `npm run brief -- save <id>,<id> <file>` to store a brief written elsewhere (pasted from any AI) into the cache and refresh the index. It reads the model name from `--model`.
- Briefs are committed files, rendered with the existing Markdown renderer.

Out of scope:
- Running a model from the repo (`npm run brief` calling an API or CLI): the first loop is prompt, paste, save. Revisit once the prompt is good.
- Fuzzy matching of selections (a brief for a subset or superset), runtime LLM calls in the browser, editing briefs in the page.
- Changes to the node format, `graph.json` or the build.

## Capabilities

### New Capabilities
- `selection-brief`: a prompt for a selection, a cache of AI-written briefs keyed by selection, and their display (fresh, stale, absent) on the Selection page.

### Modified Capabilities
<!-- None in openspec/specs/. Depends on the `selection-page` change (the Selection page and the `pick` hash); apply it first. -->

## Impact

- New: `prompts/brief.md`, `briefs/`, `viewer/brief.js` (prompt filling, key, node-content hash, shared by browser and Node), `scripts/brief.mjs`, tests.
- Changed: `viewer/views/selection.js` (brief block), `README.md`, `package.json` (script `brief`).
- `scripts/serve.mjs` already serves the repo root, so `prompts/` and `briefs/` are reachable with no change.
