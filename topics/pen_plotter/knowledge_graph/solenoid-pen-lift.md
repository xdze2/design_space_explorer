---
id: "55904a34"
title: Solenoid pen lift
type: solution
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5", "https://kylepls.com/plot", "https://lauda.ulapland.fi/bitstream/handle/10024/65132/Bircher_Martin.pdf"]
confidence: low
summary: "An on/off solenoid lifts the pen very fast, but with no control over travel or pressure"
abbr: SOL
---
**Why choose it.** Very fast up and down with a plain on/off signal, and no moving linkage. Good for dotted or stippled drawings where the pen lifts constantly.

**Tradeoffs.** No control over travel: it is either up or down, and it slams, so the pressure comes from a spring or a weight it releases. It draws real current and needs a driver stage with a flyback diode, and it adds weight to the carriage. With only two positions it suits pens and markers, not brushes.

**Links.** It excludes GRBL on an Arduino Uno shield: that board has no spare switched output for it, because the free pins are taken by the spindle and coolant functions of the firmware, and the on/off semantics would need the firmware to be changed.
