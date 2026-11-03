# Tasks

## 1. Server modes and data root

- [ ] 1.1 Parse `--edit`, `--data <dir>` and the port (positional or `--port`) in `scripts/serve.mjs`; listen on `127.0.0.1`; serve `/graph.json`, `/briefs/*` and `/prompts/*` from the data root and the rest from the repo root; print whether edit mode is on. Add `test/serve.test.mjs` (start the server on a free port with a temporary data root): static files served from the data root, `/api/status` is 404 without `--edit`, positional port still works. Verify with `npm test`

## 2. Edit endpoints

- [ ] 2.1 Extend `saveBrief` (from `selection-brief`) to delete `requests/<key>.md` under its root when it exists, so the CLI and the server both fulfil requests. Add the API with `--edit`: `GET /api/status`, `POST /api/briefs` (calls `saveBrief`), `POST /api/requests` (builds the prompt with `buildPrompt`, writes `requests/<key>.md` replacing an existing one), `GET /api/requests`; body size cap, 404 for other `/api/` paths. Add tests: paste saves a brief identical to the CLI result, unknown id and empty text are rejected with nothing written, request creation and replacement, saving removes the request. Verify with `npm test`
- [ ] 2.2 Add the protections: host and origin checks on every `POST`, write targets resolved and checked inside `<data>/briefs` and `<data>/requests`. Add tests: foreign `Origin` gets 403 and nothing is written, a mismatching `Host` is rejected, an id containing `..` writes nothing, writes without `--edit` are rejected. Verify with `npm test`

## 3. Viewer controls

- [ ] 3.1 Add `viewer/api.js` (`probe`, `saveBrief`, `requestBrief`, `listRequests`; probe never throws) and the edit block in `viewer/views/design.js`: paste box with optional model field and save button, "Request brief" button, list of pending requests. Verify in headless Chrome against `npm run serve -- --edit`: paste then the brief appears, request then the pending entry appears
- [ ] 3.2 Check the static case: against `npm run serve` (no `--edit`) the Design page has no edit block and no error, and the existing brief and prompt box still work. Verify in headless Chrome DOM output

## 4. Claude Code command and docs

- [ ] 4.1 Add `.claude/commands/brief.md` (process every file in `requests/`: read the prompt, write the brief, save it with `npm run brief -- save ... --model <your model id>`, report what was done) and add `requests/` to `.gitignore`. Verify with a real request: create one from the page, run `/brief`, check that `briefs/` has the file, the request is gone and the page shows the brief
- [ ] 4.2 Add an "Edit mode" section to `README.md` (command, flags, what it writes, the two loops, git is the history, data root) and verify the documented commands work as written. Run `npm test` and `openspec validate edit-mode`
