## ADDED Requirements

### Requirement: Capture extension
The repository SHALL contain a Chrome extension (Manifest V3, loaded unpacked) with a side panel that, for the active tab, captures the page's readable text with its URL, title and date; lists the page's images with thumbnails, size and alt text; accepts a text selection and a dragged region of the visible page as a cropped screenshot; takes a note for the page and one for each image or crop; and offers a topic picker defaulting to `pen_plotter`. Images smaller than 150×150 px SHALL start unticked and the others ticked. Only ticked images, selections and crops SHALL be sent.

#### Scenario: Capture a product page
- **GIVEN** a product page with a hero photo, an exploded diagram and a row of 32×32 icons
- **WHEN** the user opens the side panel
- **THEN** the photo and the diagram are listed ticked and the icons unticked

#### Scenario: Diagram that is not an image file
- **WHEN** the user drags a rectangle over a drawn diagram and confirms
- **THEN** a cropped screenshot of that region is added to the list with its own note field

#### Scenario: Notes
- **WHEN** the user types "belt path" as the note of an image
- **THEN** that text is sent as the image's `why`

### Requirement: Capture endpoint
`scripts/serve.mjs` SHALL accept `POST /capture` and write a bundle under `inbox/<slug>/`. It SHALL listen on the loopback interface only; refuse a request whose `Host` is not `localhost` or `127.0.0.1`; require `Authorization: Bearer <token>`, with a token generated on first start into a git-ignored file; refuse a body over 25 MB or more than 40 images; derive the slug from the title with lowercase letters, digits and `-` only, adding a numeric suffix when the folder exists; name image files `NN.<ext>` with the extension taken from an allow-list; and never write outside `inbox/`. It SHALL NOT serve `inbox/` captures to other origins.

#### Scenario: Valid capture
- **WHEN** an authorized request arrives with a title, a note, two images and a selection
- **THEN** `inbox/<slug>/page.md`, `images/01.<ext>`, `images/02.<ext>` and `manifest.json` exist, and the response names the slug

#### Scenario: Wrong token
- **WHEN** the request has no token or a wrong one
- **THEN** it is refused with 401 and nothing is written

#### Scenario: Path tricks
- **WHEN** the title is `../../x` or an image name contains `..`
- **THEN** the slug and file names are sanitized and everything stays inside `inbox/`

#### Scenario: Too large
- **WHEN** the body is larger than 25 MB
- **THEN** it is refused with 413 and nothing is written

#### Scenario: Same page twice
- **WHEN** a page whose slug already exists is captured again
- **THEN** a second folder with a numeric suffix is written and the first is untouched

### Requirement: Capture bundle
A bundle SHALL be a folder `inbox/<slug>/` with `page.md` (a header giving title, collection date and URL, then the text, then the user's selections as quotes), `images/` and `manifest.json` with the URL, title, date, topic, a hash of `page.md`, the page note, the selections, and for each image its file, source URL, alt text, caption, nearest heading, size, kind (`image` or `crop`) and note. The bundle SHALL be readable without the extension, and bundles in `inbox/` SHALL be git-ignored.

#### Scenario: Manifest content
- **WHEN** a bundle is written
- **THEN** `manifest.json` lists every image file in `images/` with its `kind` and `why`

#### Scenario: Ignored by git
- **WHEN** a bundle folder is created under `inbox/`
- **THEN** git does not list it as untracked
