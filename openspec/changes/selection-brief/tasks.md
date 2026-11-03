# Tasks

## 1. Prompt and cache helpers

- [x] 1.1 Add `prompts/brief.md` (with a version comment and the placeholders) and `viewer/brief.js` with `selectionKey`, `contentHash` and `buildPrompt`. Add `node:test` tests: same key for any order, different key for a different set, content hash changes when a selected node's body changes but not when an unrelated node changes, prompt for `gantry/corexy` contains its body, `drive/gt2-belt` as missing and the undecided decisions. Verify with `npm test`

## 2. Save command

- [x] 2.1 Add `scripts/brief.mjs` exporting `saveBrief({ root, graph, pick, text, model })` (unknown id throws with nothing written, replace not duplicate, all paths relative to `root`) plus a CLI `save <ids> <file> [--model name]` that calls it and the `brief` script in `package.json`. Add a test using a temporary directory for the output. Verify with `npm test`
- [x] 2.2 Save a real brief for `gantry/corexy,drive/gt2-belt` by hand-writing a short Markdown file and running the command; commit the result under `briefs/` as the first example. Verify that `briefs/index.json` and the file are created and that a second run replaces them

## 3. Selection page

- [x] 3.1 In `viewer/views/selection.js`, load `briefs/index.json` and the brief, parse the frontmatter, and render the brief above the summary with model name and the stale mark (the index failing to load means no brief). Verify in headless Chrome with the saved brief: fresh, then stale after editing a selected node's body in a copy of `graph.json`, then HTML in a brief shown as text
- [x] 3.2 Add the prompt box (`<details>`, "Copy prompt" button with clipboard fallback), shown when there is no brief or the brief is stale, and nothing for an empty selection. Verify in headless Chrome that the DOM contains the prompt for `#/selection?pick=gantry/corexy` and no prompt box for the empty selection

## 4. Docs

- [x] 4.1 Add a "Briefs" section to `README.md` (the loop: copy prompt, paste into an AI, save with `npm run brief`; cache layout; stale meaning) and verify the documented save command works as written. Run `npm test` and `openspec validate selection-brief`
