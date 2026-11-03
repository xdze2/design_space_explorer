---
title: H-bot
type: option
parent: gantry
requires: [drive/gt2-belt]
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** A single belt in an H shape with fixed motors. Fewer parts and cheaper than CoreXY.

**Tradeoffs.** The belt force is applied off-axis and twists the gantry, so it is only good for small, light machines. A poor fit for A3.

**Constraints.** It requires a belt drive (`drive/gt2-belt`) since the layout is the belt path.
