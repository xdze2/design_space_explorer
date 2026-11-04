---
id: "9b7ac8ab"
title: Five-bar arm (SCARA)
type: solution
sources: ["LLM:claude-opus-5-5", "https://hackaday.com/2014/02/13/a-clock-that-plots-time/", "https://github.com/IljaRukin/scara_plotter"]
confidence: low
---
**Why choose it.** Two motors at the base swing a linked pair of arms that meet at the pen. Tiny, cheap, no rails and no frame around the sheet: the PlotClock writes the time with three 9 g servos. Good for a desk toy or small text.

**Tradeoffs.** Accuracy and stiffness change across the workspace, and the area is small for the arm length. Scaling it up needs preloaded bearings and gearboxes, and few hobby firmwares support the kinematics out of the box. The motors drive the arms directly, so it brings only the drive and a way to hold the surface.
