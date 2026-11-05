## ADDED Requirements

### Requirement: Capture bundles as a source
The ingestion skill SHALL accept an `inbox/<slug>/` capture bundle as a source. It SHALL read `manifest.json`, view the ticked images (all when there are eight or fewer, otherwise the ones with a note first, then the largest), use the user's notes as hints about what to look for without treating them as facts, add one or two lines under each viewed image in `page.md` saying what it shows, write the standard raw header with the manifest's URL, and move the bundle to `topics/<topic>/raw/<slug>/` with `page.md` as the raw file. It SHALL fetch a URL itself only when none was captured, and when it cannot fetch, SHALL ask the user to capture the page with the extension. The hard rule of writing nothing under `knowledge_graph/` or `designs/` before approval SHALL still apply.

#### Scenario: Bundle with notes
- **GIVEN** a bundle whose image 02 has the note "belt path"
- **WHEN** `/ingest` runs on it
- **THEN** the agent views image 02 first, `page.md` gets a line saying what the belt path is, and the plan mentions the finding

#### Scenario: Moved to raw
- **WHEN** the plan has been written
- **THEN** the bundle folder is under `topics/<topic>/raw/` and no longer in `inbox/`

#### Scenario: Too many images
- **GIVEN** a bundle with 20 ticked images, three of which have notes
- **WHEN** the agent views images
- **THEN** it views the three with notes first and then the largest ones, not all 20

#### Scenario: Page cannot be fetched
- **WHEN** a URL is given with no bundle and the fetch fails
- **THEN** the agent asks the user to capture the page with the extension and stops
