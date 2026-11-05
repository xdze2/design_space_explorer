---
id: "5f53f3a8"
title: Leadscrew drive
type: solution
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5"]
confidence: low
summary: "A threaded screw turns the motor into precise, self-holding linear travel, but slowly"
abbr: LS
---
**Why choose it.** Precise, no stretch, self-holding when the motor is off and compact.

**Tradeoffs.** Slow, with more friction and wobble on long travel, and heavy on a moving gantry. It is a poor fit for the speeds a drawing machine wants, and it trades speed for accuracy that the pen interface often cannot use anyway. The longer the travel, the worse it gets, so a large sheet makes it slower and whippier.

**Links.** It excludes the single-rail cantilever: a screw along the X beam adds mass and wobble at the end of the overhang, which is exactly where the cantilever is weakest. CoreXY, the H-bot and the polargraph, which are defined by their belts, and hobby servos, which cannot turn it far enough, exclude it too (declared on them).
