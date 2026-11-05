## Why

Ingestion starts from a page fetched as an LLM summary (WebFetch) or saved by hand. Detail is lost, JavaScript-rendered and logged-in pages come back empty, and the images (exploded views, dimensions, spec tables as pictures) are ignored. The user is the best judge of which parts of a page matter, so capture should be done by the user in their own browser, with a way to say why.

## What Changes

- A Chrome extension (Manifest V3, loaded unpacked) with a side panel: it captures the page's readable text, lists its images as thumbnails to tick, takes selected text and cropped screenshots of a region, and takes a "why this matters" note for the page and for each image, plus a topic picker.
- `scripts/serve.mjs` gets a localhost-only `POST /capture` endpoint that writes a bundle `inbox/<slug>/` (`page.md`, `images/`, `manifest.json`). It checks a shared token, limits sizes and writes only inside `inbox/`.
- The ingest skill reads these bundles: it views the ticked images, uses the user's notes as hints, writes a short note per image into the raw `page.md`, and moves the bundle into `topics/<topic>/raw/`. This replaces the WebFetch step and the "save it into raw/ yourself" fallback.
- `inbox/<slug>/` bundles are git-ignored.

Out of scope: headless or Playwright batch capture (it could reuse the extractor later), Firefox, turning photos into node pictures, authentication beyond the local token, publishing to a store.

## Capabilities

### New Capabilities
- `source-capture`: the extension's capture and curation behavior, the bundle format, and the local `/capture` endpoint.

### Modified Capabilities
- `source-ingestion`: the ingest skill accepts capture bundles as a source.

## Impact

- New folder `extension/` (manifest, service worker, side panel, content script, a small text extractor).
- `scripts/serve.mjs` (endpoint, token) and a small module for writing bundles, with tests.
- `skills/ingest/SKILL.md` step 1, `.gitignore`, `README.md` (how to load the extension and start capturing).
- No change to the graph, the viewer or the design format.
