---
id: "a2651c78"
title: "Turn drawing commands into motion"
type: function
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md", "LLM:claude-opus-5-5", "https://www.makerq.com/products/easydraw-v4-drawing-and-writing-machine-fully-assembled"]
confidence: low
---
**Why it matters.** The controller runs the firmware that turns commands from the computer into step pulses and pen moves. Most hobby boards take G-code; AxiDraw-style boards take their own commands from an Inkscape extension. It sets the workflow (how drawings are sent), the acceleration tuning available and which kinematics are supported out of the box.

**Tradeoffs.** Mainstream hobby boards are cheap and well documented. Boards with wireless add convenience but need more configuration. A dedicated board gives the simplest workflow but ties the machine to its software.
