---
id: "55269563"
title: Draw a design on paper with a pen
type: function
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why it matters.** This is the reason the machine exists: take a vector drawing and reproduce it on a sheet of paper with a pen, repeatably and without a human hand. Everything below is a way to get there.

**Tradeoffs.** The drawing job is split into three parts that pull against each other: moving the pen in the plane, touching and leaving the paper cleanly, and turning a file into motor steps. Guiding the axes without play is not a part of its own: it belongs to the way the pen is moved, so each gantry solution brings it as a sub-function. In practice, line quality comes more from rigidity, play removal and the pen interface than from any single component choice, so a cheap part that is mounted well beats an expensive one that is not.
