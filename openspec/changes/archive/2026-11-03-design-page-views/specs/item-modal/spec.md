# Spec Delta

## REMOVED Requirements

### Requirement: Node detail in a modal
**Reason**: Node detail is the main action of the Graph page and should not hide the page it belongs to.
**Migration**: See `design-page`, requirement "Node view placement" (drawer on Design, main pane on Graph).

### Requirement: Closing the modal
**Reason**: There is no modal. 
**Migration**: The drawer closes with Esc or its close button ("Node view placement" in `design-page`); there is no backdrop.

### Requirement: Select from the modal
**Reason**: Choosing moves to the node views.
**Migration**: See `design-page`, requirement "Choosing options".

### Requirement: Modal state in the URL
**Reason**: `view=<id>` stays, but it no longer opens a modal.
**Migration**: See `design-page`, requirement "Views and routes" (page, `pick` and `view` encoded independently; `#/browse/<id>` read as Graph with `view=<id>`).

### Requirement: Panel actions
**Reason**: The panel is replaced by the selection tray; the Home link and Reset remain.
**Migration**: See `design-page`, requirement "Selection tray" (Reset keeps the page, chips have a remove action).

### Requirement: Browse overview
**Reason**: Browse becomes the Graph page, with the node in a main pane instead of a modal.
**Migration**: See `design-page`, requirements "Node view placement" and "Choosing options" (tree marks chosen options).
