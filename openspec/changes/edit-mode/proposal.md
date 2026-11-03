# Proposal

## Why

Briefs (see `selection-brief`) can only be saved from the command line, and there is no LLM API yet; the AI is Claude Code working on local files, or a person pasting text. The site must stay fully static for GitHub Pages, so any write capability has to be an optional local layer, invisible when the site is only served statically. Git is the version history, so the backend only needs to write plain files.

## What Changes

- Add an **edit mode** to the local server: `npm run serve -- --edit` enables a few write endpoints under `/api/`. Without the flag the server stays read-only, like GitHub Pages.
- The viewer probes `/api/status` at load; edit controls appear only if it answers. On a static host it returns 404 and the viewer is unchanged.
- First edit features, both on the Design page:
  - **Paste**: a box to paste a brief written by an AI; the server saves it through `saveBrief`.
  - **Request**: a "Request brief" button that writes the prompt to `requests/<key>.md`. A project slash command `/brief` tells Claude Code to process pending requests (write the brief, update the index, delete the request). The page lists pending requests and shows the brief after a refresh.
- Add a **data root** option, `--data <dir>` (default: the repository root). Server write paths and the data files the viewer loads go through it, so a separate data repository per topic can be used later.
- Security of the local server: bind to `127.0.0.1`, only write inside allowed data folders, reject requests whose `Origin` or `Host` is not the server itself.
- The server never runs git. Changes show up in `git diff`; the person commits.

Out of scope:
- Editing nodes in the page (a later change), auto-commit or any git operation, authentication beyond localhost, runtime LLM calls, hosting the backend anywhere other than the local machine.
- Moving the existing data into a separate repository (only keep the paths ready for it).

## Capabilities

### New Capabilities
- `edit-mode`: an optional local write layer (status probe, paste and request endpoints, data root, local-only protections) with the viewer's edit controls, absent on a static host.

### Modified Capabilities
<!-- None in openspec/specs/. Builds on the `selection-page` and `selection-brief` changes, which must be applied first. -->

## Impact

- `scripts/serve.mjs`: argument parsing (`--edit`, `--data`, port), `/api/` handlers, host and origin checks. Today the port is the first positional argument; keep that working.
- `scripts/brief.mjs`: `saveBrief` is called from the server (already exported by `selection-brief`).
- `viewer/`: an `api.js` helper (probe and calls), edit controls in `views/design.js`.
- New: `.claude/commands/brief.md`, a `requests/` folder (git-ignored: transient), tests for the server.
- `README.md`: an "Edit mode" section.
