---
id: "c7102c51"
title: GRBL on Arduino Uno with CNC shield
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md", "LLM:claude-opus-5-5", "https://howtomechatronics.com/projects/diy-pen-plotter-with-automatic-tool-changer-cnc-drawing-machine/"]
confidence: low
---
**Why choose it.** The cheapest and most widely documented route: an Uno clone with a CNC shield and plug-in stepper drivers, taking standard G-code, with common senders working out of the box. Better drivers for quieter operation are a small step up. CoreXY (and so H-bot) is a compile option. The shield's third driver slot runs a Z-axis stepper lift, and GRBL-Plotter adds tool changes.

**Tradeoffs.** No wireless, and the pen servo needs a firmware fork with servo support. Changing settings means editing and re-flashing, rather than a configuration file.
