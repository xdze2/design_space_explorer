## 1. Receiving side

- [ ] 1.1 `scripts/capture.mjs`: `writeBundle(root, payload)` returning the slug (slug rules, extension allow-list, `NN.<ext>` names, `page.md`, `manifest.json` with the SHA-1 of `page.md`, containment check inside `inbox/`). Verify: unit tests for a normal bundle, `../../x` titles, a bad extension, a name collision (suffix), and the 40-image limit.
- [ ] 1.2 `scripts/serve.mjs`: bind to loopback, create `.capture-token` on first start, add `POST /capture` (Host check, bearer token, 25 MB limit, CORS for the extension origin only) calling `writeBundle`. Verify: an HTTP test for a valid request, a missing and a wrong token (401), an oversize body (413), a foreign Host (refused).
- [ ] 1.3 `.gitignore`: `inbox/*/` and `.capture-token`. Verify: a new folder under `inbox/` is not listed by git, `inbox.md` still is.

## 2. Extension

- [ ] 2.1 `extension/manifest.json` (MV3, side panel, permissions as in the design), service worker, and an options field for the token and server address. Verify: loads unpacked in Chrome without errors.
- [ ] 2.2 `extension/extract.js`: the in-page function for readable text as Markdown, and the image collector (src, size, alt, caption, heading, small flag). Verify: unit tests on fixture HTML with a small DOM, plus a manual run on the AxiDraw and EasyDraw pages.
- [ ] 2.3 Side panel: page note, topic picker, image grid with ticks and per-image notes, selection capture, Send button with the result (slug or error). Verify: manual capture of a page produces a bundle in `inbox/`.
- [ ] 2.4 Region crop: overlay to drag a rectangle, `captureVisibleTab`, canvas crop, added as a `crop` image. Verify: manual crop of a diagram on a product page appears in the bundle's `images/` and manifest.

## 3. Ingest skill

- [ ] 3.1 Update `skills/ingest/SKILL.md`: bundles as a source (listing, step 1 as in the design, image viewing order, image lines in `page.md`, move to `raw/`), the URL fallback, the message when a fetch fails. Verify: the user reviews the diff of `SKILL.md`.
- [ ] 3.2 Capture the AxiDraw V3 page with the extension and run `/ingest` on the bundle. Verify: the plan uses the image findings and notes, nothing under `knowledge_graph/` or `designs/` changes before approval, and the bundle ends up in `raw/`.

## 4. Wrap-up

- [ ] 4.1 README: how to load the extension, start the server, paste the token, capture and ingest. Verify: following it from scratch works.
- [ ] 4.2 `npm test` passes; list in the change's design.md what the AxiDraw run showed that the extension or the skill got wrong.
