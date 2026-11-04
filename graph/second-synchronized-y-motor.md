---
id: "018d772f"
title: Second synchronized Y motor
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md", "LLM:claude-opus-5-5"]
confidence: low
summary: "A motor on each side of the beam squares it electronically, at the cost of an extra motor and driver"
---
**Why choose it.** Each side of the beam gets its own motor, so the beam cannot skew from one-sided driving and no cross rod is needed. Firmware that supports ganged axes can even square the beam against the endstops at homing.

**Tradeoffs.** Extra motor, driver and wiring, and both sides must be tuned identically: any mismatch skews the beam. A mechanical cross rod is simpler if the electronics are tight.
