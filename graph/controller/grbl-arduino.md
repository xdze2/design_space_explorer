---
title: GRBL on Arduino Uno + CNC Shield
type: option
parent: controller
compatible_with: [gantry/cartesian-dual-rail, gantry/corexy]
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** About $14 for the board and shield, widely documented, takes standard G-code, and Universal G-code Sender works with it. A4988 drivers cost $8 (TMC2209 for quieter operation is +$10). CoreXY is available as a compile option.

**Tradeoffs.** No Wi-Fi, and the pen servo needs a servo-supporting GRBL fork.
