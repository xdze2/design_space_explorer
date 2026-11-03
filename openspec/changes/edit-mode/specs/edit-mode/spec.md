# Spec Delta

## Purpose

An optional local write layer for the otherwise static viewer, so briefs can be added from the page when the site runs locally with edit mode on, and so the same files work unchanged on a static host where no edit controls exist.

## ADDED Requirements

### Requirement: Edit mode is opt-in
The local server SHALL accept write requests only when started with the edit flag. Without it, every write endpoint SHALL be absent and the server SHALL serve files read-only.

#### Scenario: Read-only by default
- **WHEN** the server is started without the edit flag and a write request is sent
- **THEN** the request is rejected and no file is written

#### Scenario: Edit flag
- **WHEN** the server is started with the edit flag
- **THEN** it reports at startup that edit mode is on and answers the status request

### Requirement: Edit controls only where available
The viewer SHALL probe the status endpoint at load and SHALL show edit controls only when it answers. When it does not (a static host or a server without edit mode), the viewer SHALL show no edit controls and no error.

#### Scenario: Static host
- **WHEN** the status endpoint returns 404
- **THEN** the Design page shows no paste box and no request button, and no error

#### Scenario: Edit server
- **WHEN** the status endpoint answers
- **THEN** the Design page shows the paste box and the request button

### Requirement: Paste a brief
In edit mode the Design page SHALL let the user paste a brief for the current selection and an optional model name, and save it. The saved brief SHALL be identical to one saved by the save command for the same selection.

#### Scenario: Paste and save
- **WHEN** the user pastes a Markdown text for `gantry/corexy` and saves
- **THEN** the brief is stored in the cache for that selection and the page shows it

#### Scenario: Unknown id
- **WHEN** a save request contains an id that is not in the graph
- **THEN** it is rejected with a message naming the id and nothing is written

#### Scenario: Empty text
- **WHEN** the pasted text is empty
- **THEN** it is rejected and nothing is written

### Requirement: Request a brief
In edit mode the Design page SHALL let the user request a brief for the current selection. A request SHALL be a file in `requests/` named by the selection key and containing the prompt, and SHALL list the selection and the prompt version. The page SHALL show which requests are pending.

#### Scenario: Create a request
- **WHEN** the user requests a brief for `gantry/corexy`
- **THEN** `requests/<key>.md` exists with the prompt for that selection and the page shows the request as pending

#### Scenario: Request replaced
- **WHEN** the same selection is requested again
- **THEN** the existing request file is replaced, not duplicated

#### Scenario: Request fulfilled
- **WHEN** a brief for that selection is saved
- **THEN** the request is removed and the page, on refresh, shows the brief

### Requirement: Processing requests with Claude Code
The repository SHALL provide a project command that instructs Claude Code to process all pending requests: read each request, write a brief from it, save it with the save command and delete the request.

#### Scenario: Command present
- **WHEN** the user runs `/brief` in Claude Code in this repository
- **THEN** the instructions tell it to process every file in `requests/` and to save each result with the save command, naming the model

### Requirement: Local-only protections
The server in edit mode SHALL listen on the loopback address only, SHALL reject write requests whose `Origin` or `Host` is not the server's own, and SHALL write only inside the allowed data folders under the data root.

#### Scenario: Foreign origin
- **WHEN** a write request carries an `Origin` that is another site
- **THEN** it is rejected with 403 and nothing is written

#### Scenario: Path escape
- **WHEN** a request would write outside the allowed folders, for example through `..` in an id
- **THEN** it is rejected and nothing is written

#### Scenario: Loopback only
- **WHEN** the server starts in edit mode
- **THEN** it listens on `127.0.0.1` only

### Requirement: Data root
The server and the save command SHALL read and write data under a data root that defaults to the repository root and can be set with an option. The git history of that folder SHALL NOT be touched by the server.

#### Scenario: Other data root
- **WHEN** the server is started with a data root other than the repository root
- **THEN** the viewer loads `graph.json` and `briefs/` from it and saves go there

#### Scenario: No git
- **WHEN** a brief is saved
- **THEN** only files change on disk and no git command is run
