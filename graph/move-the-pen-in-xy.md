---
id: "854ac5e5"
title: Move the pen in XY
type: function
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why it matters.** The pen has to reach every point of the drawing area, and acceleration, not top speed, sets how long a drawing takes: drawings are full of short segments and corners. The limit is moving mass and resonance, not motor torque, since a light carriage needs well under what a small stepper can give.

**Tradeoffs.** A light moving part and a stiff frame are in tension: stiffness usually costs mass. The layouts below trade parts count, belt complexity, openness for loading paper and the risk of the beam skewing (racking).
