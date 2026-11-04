---
id: "55904a34"
title: Solenoid pen lift
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Very fast up and down with a plain on/off signal, and no moving linkage. Good for dotted or stippled drawings where the pen lifts constantly.

**Tradeoffs.** No control over pressure or travel: it is either up or down, and it slams. It draws real current and needs a driver stage with a flyback diode, and it adds weight to the carriage.

**Links.** It excludes GRBL on an Arduino Uno shield: that board has no spare switched output for it, because the free pins are taken by the spindle and coolant functions of the firmware, and the on/off semantics would need the firmware to be changed.
