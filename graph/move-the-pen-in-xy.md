---
id: "854ac5e5"
title: Move the pen in XY
type: function
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md", "LLM:claude-opus-5-5", "https://stefan.wtf/p/penplotter", "https://en.wikipedia.org/wiki/HP_7470"]
confidence: low
---
**Why it matters.** The pen has to reach every point of the drawing area, and acceleration, not top speed, sets how long a drawing takes: drawings are full of short segments and corners. On a gantry the limit is moving mass and resonance, not motor torque, since a light carriage needs well under what a small stepper can give.

**Tradeoffs.** A light moving part and a stiff frame are in tension: stiffness usually costs mass. The layouts below trade parts count, belt complexity, openness for loading media, the risk of the beam skewing (racking), and orientation: most lie flat, a polargraph hangs on a wall, an arm sits beside the sheet, and a grit-wheel machine moves the paper instead of the pen along one axis. Each layout brings the sub-functions it needs: gantries bring drive, transmission, guides and a way to hold the surface; an arm needs neither guides nor transmission; a polargraph hangs on its own board.
