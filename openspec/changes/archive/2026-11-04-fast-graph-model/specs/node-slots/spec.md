## REMOVED Requirements

### Requirement: Optional slot field
**Reason**: The structure now comes from `how` links, so nodes no longer carry a group label, and the top bar that used slots is removed.
**Migration**: None. The demo graph is rewritten without `slot`, and the build rejects the field.

### Requirement: Demo graph slots
**Reason**: The `slot` field no longer exists.
**Migration**: None.
