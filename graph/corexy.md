---
id: "1f4df7b0"
title: CoreXY
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md", "LLM:claude-opus-5-5", "https://hackaday.com/2016/02/29/design-analysis-core-xy-vs-h-bot/"]
confidence: low
---
**Why choose it.** Both motors are fixed at the rear corners, so the moving mass is minimal and acceleration can be very high. Two belts on two planes cancel the twisting moment that an H-bot puts on the beam, so racking is low. The kinematics are X = (A+B)/2 and Y = (A-B)/2, supported by common firmware either as a build option or through configuration.

**Tradeoffs.** It brings the drive, the transmission, the guides and a way to hold the surface; the beam ends ride on two parallel guides, so the guide must be well matched. It needs many idlers and a long belt run, with equal tension and equal path length on both belts, or drawings skew and circles turn into ovals. A square, rigid frame is not optional. It costs more than a plain Cartesian layout or an H-bot.

**Links.** It requires a belt drive (GT2 belt): the two-belt kinematics are defined by the belt path and cannot be built with a screw. It excludes the leadscrew for the same reason.
