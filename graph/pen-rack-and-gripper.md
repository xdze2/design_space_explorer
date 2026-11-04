---
id: "565c46d1"
title: Pen rack and gripper
type: solution
sources: ["LLM:claude-opus-5-5", "https://howtomechatronics.com/projects/diy-pen-plotter-with-automatic-tool-changer-cnc-drawing-machine/", "https://www.instructables.com/DIY-Multicolor-Pen-Plotter/", "https://www.bitsavers.org/pdf/hp/plotter/7475A/07475-90000_7475A_Service_Manual_198708.pdf"]
confidence: low
---
**Why choose it.** Pens wait in docks at fixed machine positions; the carriage drives to a dock and a gripper picks or drops a pen (GRBL-Plotter T commands, or the HP 7475A's six-pen carousel). Unattended multi-colour plots, with many pens (eight on one DIY build).

**Tradeoffs.** Extra mechanism, a dock area outside the drawing and a calibration per dock. Pens dry unless the docks cap them.

**Links.** It requires the Z-axis stepper lift: pulling a pen out of a dock needs more vertical travel and force than the short stroke of a servo lift.
