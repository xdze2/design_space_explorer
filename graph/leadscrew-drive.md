---
id: "5f53f3a8"
title: Leadscrew drive
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Precise, no stretch, self-holding when the motor is off and compact.

**Tradeoffs.** Slow, with more friction and wobble on long travel, and heavy on a moving gantry. It is a poor fit for the speeds a drawing machine wants, and it trades speed for accuracy that the pen interface often cannot use anyway.

**Links.** It excludes the single-rail cantilever: a screw along the X beam adds mass and wobble at the end of the overhang, which is exactly where the cantilever is weakest. It is also incompatible with CoreXY, which is defined by its belt paths (that link is declared on CoreXY).
