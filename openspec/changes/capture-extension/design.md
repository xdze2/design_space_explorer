## Context

`scripts/serve.mjs` is a small static server for `viewer/` and `topics/`; it refuses `raw/`. The ingest skill (`skills/ingest/SKILL.md`) collects a source in step 1 by fetching a URL (a summary, not a copy) or asking the user to save the page into `raw/`. `topics/<topic>/raw/` is git-ignored; `inbox.md` lists pending items and `inbox/` holds hand-saved files. An extension cannot write into the project folder, so the repo needs a receiving side.

## Goals / Non-Goals

**Goals:**
- The user picks what matters on a page in their own browser, including logged-in pages and images, and says why.
- The bundle on disk is plain files that the skill (and a person) can read without the extension.

**Non-Goals:**
- Batch or unattended capture, Firefox, a store release, a hardened remote service.

## Decisions

- **Manifest V3, side panel, no build step.** Plain ES modules under `extension/`, loaded unpacked. Permissions: `activeTab`, `scripting`, `sidePanel`, `storage`, and host permission for `http://localhost/*` only. The side panel stays open while the user scrolls and selects.
- **Page extraction in the page** via `chrome.scripting.executeScript`: a small function that clones the document, removes scripts, styles, nav, footer and hidden elements, prefers `main`/`article`, and converts headings, paragraphs, lists and tables to Markdown. No library, so no bundling; good enough for product pages, and the user can add exact selections where it falls short.
- **Images** are collected from `img` (using `currentSrc`), `picture` sources and CSS background images of large elements, with natural size, alt text, nearest caption or figcaption and the heading above. Images under 150×150 px or with a tracking-like URL start unticked. Ticked images are fetched by the page context (so cookies apply) and sent as bytes. **Region crop**: the user drags a rectangle on the page (content script overlay), and the worker takes `chrome.tabs.captureVisibleTab` and crops it on a canvas; this covers diagrams that are not image files, at screen resolution.
- **Notes**: one for the page and one per image or crop, free text, saved in the manifest as `why`. They are hints for the ingest, not facts.
- **Endpoint `POST /capture`** in `serve.mjs`, JSON body with base64 images (simple; bundles are a few MB). Rules: only accepted when the request's `Host` is `localhost` or `127.0.0.1` and the server listens on loopback; requires `Authorization: Bearer <token>`, where the token is generated on first start into `.capture-token` (git-ignored) and pasted once into the extension's options; body limit 25 MB; at most 40 images; slug derived from the title with `[a-z0-9-]` only and a numeric suffix on collision; every path is resolved and must stay inside `inbox/`; image file names are `NN.<ext>` with the extension from an allow-list (png, jpg, webp, gif, svg), so no client-chosen path component is used. CORS allows the extension's origin only. Binding to loopback is the main protection; the token stops other web pages from posting.
- **Bundle format**: `inbox/<slug>/page.md` (header like a raw file, then text, then the user's selections as quotes), `images/NN.<ext>`, and `manifest.json` `{ url, title, date, topic, hash, note, selections: [...], images: [{ file, src, alt, caption, heading, width, height, kind: "image"|"crop", why }] }`. `hash` is the SHA-1 of `page.md` so a re-capture can be spotted.
- **Skill change**: source "an `inbox/<slug>/` bundle" (named by the user or found when listing the inbox). Step 1 then: read the manifest, view the ticked images (all of them if there are 8 or fewer, otherwise those with a `why` first, then the largest), add under each image in `page.md` one or two lines on what it shows, write the standard raw header with the manifest's URL, move the folder to `topics/<topic>/raw/<slug>/` with `page.md` as the raw file. The WebFetch route stays only for a URL given without a bundle, and the "ask the user to save it" fallback now says "use the extension".
- **Git**: `inbox/*/` and `.capture-token` are ignored; `inbox.md` and the loose files already tracked are untouched.

## Risks / Trade-offs

- Hand-written HTML-to-Markdown will miss odd pages → selections and the screenshot crop are the escape hatch.
- Region crop is limited to the visible tab and screen resolution → acceptable for diagrams; larger ones can be captured as images when they are image files.
- A token in a plain file is weak against local malware → the threat model is other web pages, not local processes.
- Chrome-only and manual loading → fine for a solo tool; a Firefox port would need the side-panel API swapped.
