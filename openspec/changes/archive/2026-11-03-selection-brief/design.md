# Design

## Context

The Selection page (change `selection-page`, not yet applied) already computes `analyze` and `undecided` and renders node bodies with `renderMarkdown`. The static server serves the repo root. Project constraint: no runtime LLM calls in the viewer. See proposal.md.

## Goals / Non-Goals

**Goals:**
- One prompt builder used by both the browser and the Node script, so what the page shows is exactly what was used to write a brief.
- A cache that is plain files, readable and committable.

**Non-Goals:**
- Calling a model from the repo, partial matching of selections, editing in the page.

## Decisions

**Shared pure module `viewer/brief.js`.** It exports `selectionKey(pick)`, `contentHash(graph, pick)` and `buildPrompt(template, graph, pick)`; no DOM, no `fs`. The browser fetches `prompts/brief.md` and the script reads it from disk, then both call the same functions. `buildPrompt` reuses `analyze` and `undecided`.
*Alternative:* duplicate logic in the script. Rejected: the prompt in the page and the one used for a brief would drift.

**Synchronous non-crypto hash.** Key and content hash use a small 53-bit string hash (cyrb53) written in `brief.js`, shown as hex. They are cache keys and change detectors, not security. Synchronous, so no `crypto.subtle` (async, secure-context only) and identical in browser and Node.
*Alternative:* SHA-256. Rejected for the async API and little gain here.

**Key = hash of the sorted ids joined by `,`.** File name `briefs/<key>.md`. Ids contain `/`, so they cannot be file names; the frontmatter `pick` keeps the readable list.

**Content hash covers what the prompt uses about the selection.** For the sorted selected nodes: id, title, body, sources, `requires` and `excludes`. A change to any selected node marks the brief stale; a change to an unrelated node does not.
*Assumption:* a change to the set of undecided decisions does not make a brief stale. Revisit if it hurts.

**Index plus files.** `briefs/index.json` is `{ "<key>": { "file": "<key>.md" } }` so the page needs one fetch to know if a brief exists, then one to load it. Frontmatter is parsed with a few lines in the page (`---` block, simple `key: value` lines; `pick` as a comma list), not a YAML library, because the script writes it in that restricted form itself.
*Alternative:* list the directory. Rejected: a static server gives no listing.

**Save command, no model.** The logic is an exported function `saveBrief({ root, graph, pick, text, model })` in `scripts/brief.mjs` (so another caller, such as the future edit-mode server, can reuse it). `root` is the data root directory, default the repo root, so data paths are not hard-coded (a separate data repo is the future target). `scripts/brief.mjs save <ids> <file> [--model name]` is a thin CLI over it; it validates ids against `graph.json`, writes `briefs/<key>.md` with frontmatter `pick`, `content_hash`, `model`, `prompt_version`, `created`, and rewrites `index.json`. `prompt_version` is the first line comment of `prompts/brief.md` (`<!-- version: 1 -->`), so changing the template is visible in saved briefs. The page does not compare prompt versions in v1; it is only recorded.

**Page block.** `views/selection.js` renders, above the summary: brief (fresh or with a stale mark) or, if none, the prompt box (`<details>`) with a copy button. When stale, the prompt box is shown too, below the stale brief. Copy uses `navigator.clipboard` and falls back to selecting the text when unavailable.

**Prompt template.** `prompts/brief.md` asks for a short brief in English: what the combination is, why the options fit together, the conflicts and missing requirements and what to do, the open decisions to decide next with a recommendation, and a note on low-confidence sources. Placeholders `{{selected}}`, `{{problems}}`, `{{undecided}}`. It tells the model to use only the given nodes and to say when something is not in them.

## Risks / Trade-offs

- [A cached brief can be wrong or invented by the model] → Show the model name; mark `confidence` of the selected nodes in the prompt; the brief is a committed file, so it is reviewable in git.
- [Stale detection ignores the undecided set] → Accepted for v1, recorded above.
- [Pasted output may contain HTML] → Rendered through the escaping Markdown renderer.
- [Clipboard API needs a secure context] → `localhost` counts as secure; fallback selects the text.
