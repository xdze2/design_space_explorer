---
id: "a2651c78"
title: Turn G-code into motion
type: function
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why it matters.** The controller runs the firmware that turns G-code into step pulses. It sets the workflow (how drawings are sent), the acceleration tuning available and which kinematics are supported out of the box.

**Tradeoffs.** Mainstream hobby boards are cheap and well documented. Boards with wireless add convenience but need more configuration.
