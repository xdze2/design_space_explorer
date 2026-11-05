---
id: "6d52ba8e"
title: Transmit motor motion
type: function
sources: ["LLM:claude-sonnet"]
confidence: low
---
**Why it matters.** The motor turns; the pen must translate. This sub-function converts rotation into travel and sets resolution, speed, and how much stretch or backlash ends up in the drawing. Resolution is not accuracy: a high step count per millimetre looks precise on paper, while real accuracy is set by stretch, play and squareness.

**Tradeoffs.** Belts are fast, cheap and light but stretch. Screws are precise and slow. Several layouts need this same function, so one choice here serves all of them.
