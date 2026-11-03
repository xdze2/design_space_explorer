---
id: "18f0f7e8"
title: Leadscrew
type: option
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Precise, no stretch, self-holding and compact.

**Tradeoffs.** Slow, with more friction and wobble on long travel, and heavy on a moving gantry. Poor for A3 speeds.

**Constraints.** It excludes CoreXY (`gantry/corexy`) and H-bot (`gantry/h-bot`): both are defined by their belt paths and cannot be built with screws.
