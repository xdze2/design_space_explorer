---
id: "18882c3f"
title: Repeatability
type: constraint
sources: ["LLM:claude-opus-5-5", "https://lostpixels.io/writings/the-difference-between-plotted-and-printed-artwork", "https://github.com/IljaRukin/scara_plotter"]
confidence: low
---
**The limit.** Coming back to the same point: a second colour on the lines of the first, a second pass over a line, the end of a closed shape meeting its start. It differs from accuracy, which is where a point lands relative to the file.

**How solutions fare.** Open-loop motors drift for good after a skipped step, while encoders correct it. Backlash in geared steppers, servo deadband and loose guides spoil it; rails and well-preloaded wheels keep it. Pen changes are the biggest risk: every reseat can move the tip. Racks and fixed pens can be calibrated, manual swaps rely on the holder. How much drift is tolerable belongs to a design document.
