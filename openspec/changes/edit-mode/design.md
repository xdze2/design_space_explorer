# Design

## Context

`scripts/serve.mjs` is a plain `node:http` static server over the repo root; the port is the first positional argument. The viewer fetches `../graph.json` and (after `selection-brief`) `briefs/index.json` and `prompts/brief.md`. `saveBrief({ root, graph, pick, text, model })` and `buildPrompt` are shared pure or root-relative modules (`scripts/brief.mjs`, `viewer/brief.js`). See proposal.md.

## Goals / Non-Goals

**Goals:**
- The deployed static site is byte-for-byte the same files; edit mode is only server behavior plus controls hidden unless a probe answers.
- No duplicated logic: the server calls the same `saveBrief` and `buildPrompt` as the CLI and the page.

**Non-Goals:**
- Auth, git operations, node editing, multi-user, hosting the server.

## Decisions

**Edit mode is a server flag, not a second server.** `serve.mjs` parses `--edit`, `--data <dir>` and the port (positional or `--port`). The write handlers are mounted only with `--edit`; otherwise `/api/*` is a 404 like on a static host.
*Alternative:* a separate `edit-server.mjs`. Rejected: two servers to keep in sync for the static part.

**Endpoints (JSON, edit mode only).**
- `GET /api/status` → `{ "edit": true }`. The viewer's only probe.
- `POST /api/briefs` `{ pick, text, model }` → calls `saveBrief` (and removes the matching request).
- `POST /api/requests` `{ pick }` → the server builds the prompt with `buildPrompt` from the data root's `graph.json` and `prompts/brief.md` and writes `requests/<key>.md`. The server builds it so the file is exactly what the viewer would show; the client sends no prompt text.
- `GET /api/requests` → pending keys with their `pick`, so the page can show them.
Anything else under `/api/` is 404. Request bodies are capped (1 MB).

**Protections.** Listen on `127.0.0.1` only. For every `POST`, require `Host` equal to `127.0.0.1:<port>` or `localhost:<port>` and, when an `Origin` header is present, an origin equal to the same; this stops other web pages from posting to the local server, including DNS-rebinding. Ids are checked against `graph.json` before being used, file names come from the hash key, never from user text, and writes are resolved and checked to be inside `<data>/briefs` or `<data>/requests`.
*Alternative:* a random token printed at startup. Rejected for v1: the host and origin check is enough for a localhost-only prototype; revisit if the server is ever exposed.

**Data root.** One `dataRoot` (default: repo root) is used by `serve.mjs`, `brief.mjs` and the handlers. For the viewer, the server serves the files it knows as data (`/graph.json`, `/briefs/*`, `/prompts/*`) from `dataRoot`, and everything else (`/viewer/*`) from the repo root. With the default both are the same folder, so nothing changes today; a separate data repository later only needs `--data`. The viewer keeps fetching relative URLs.
*Assumption:* on GitHub Pages the published folder contains both viewer and data (single repo). A split layout needs a deploy step and is a later concern.

**Request files are transient.** `requests/` is git-ignored: it is a work queue, not history. The briefs that come out are the committed artifact. Each file has frontmatter (`pick`, `prompt_version`, `created`) and then the prompt.

**Claude Code loop.** `.claude/commands/brief.md` tells Claude Code: list `requests/`; for each, read the prompt, write the brief following it, save it with `npm run brief -- save <ids> <file> --model <model name>`, which also deletes the matching request. The page lists pending requests and, after a refresh, shows the brief. No watching or push in v1.
*Alternative:* a file watcher that pings Claude Code. Rejected: there is no way to trigger it from outside, and a manual "process the pending briefs" is fine for a solo flow.

**Viewer side.** `viewer/api.js` exports `probe()` (cached `GET /api/status`, false on any failure), `saveBrief(pick, text, model)`, `requestBrief(pick)` and `listRequests()`. `views/design.js` shows the edit block only when `probe()` is true. After a successful call the page re-renders from the hash (no hidden state). Pages stay pure functions of `(graph, params, pick)`, with the probe result and the brief data loaded before render.

## Risks / Trade-offs

- [Local server with write access] → Loopback only, host and origin checks, fixed target folders, hashes as file names, and no git or shell calls.
- [`localhost` is reachable by any local process] → Accepted: same trust level as running the repo's scripts.
- [`saveBrief` removing the request couples two features] → It is one line in `saveBrief`; covered by a test.
- [Pasted text stored verbatim] → It is rendered through the escaping Markdown renderer.
- [Existing `serve.mjs` positional port] → Keep it, add flags, test both forms.

## Open Questions

- Which "model name" does Claude Code record: a fixed string in the command file, or whatever it reports? The command file asks it to report its own model id; a wrong value only affects a label.
