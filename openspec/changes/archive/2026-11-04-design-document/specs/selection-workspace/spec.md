# Spec Delta

## REMOVED Requirements

### Requirement: Selection page
**Reason**: The selection is replaced by the design document, and the selection view by the node panel and the design overview.
**Migration**: See `design-page` (Design page layout, Node panel content) and `design-document`.

### Requirement: Selection consequences
**Reason**: Undecided functions, missing requirements and conflicts are now computed from the design.
**Migration**: See `design-document` (Excluded and required solutions, Design problems) and the overview in `design-page`.

### Requirement: Page and selection in the URL
**Reason**: The design is no longer in the URL; the hash holds view state only.
**Migration**: The design is kept in browser storage and moved between machines with export and import (`design-document`); view state is in `design-page` Views and routes.
