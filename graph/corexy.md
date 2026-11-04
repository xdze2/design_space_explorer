---
id: "1f4df7b0"
title: CoreXY
type: solution
sources: ["LLM:claude-sonnet", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Both motors are fixed at the rear corners, so the moving mass is minimal and acceleration can be very high. Both ends of the beam are driven, so racking is low. The kinematics are X = (A+B)/2 and Y = (A-B)/2, supported by common firmware either as a build option or through configuration.

**Tradeoffs.** It brings two sub-functions, the way motion is transmitted and the way the axes are guided; the beam ends ride on two parallel guides, so the guide must be well matched. It needs many idlers and a long belt run, with equal tension and equal path length on both belts, or drawings skew and circles turn into ovals. A square, rigid frame is not optional. It costs more than a plain Cartesian layout.

**Links.** It requires a belt drive (GT2 belt): the two-belt kinematics are defined by the belt path and cannot be built with a screw. It excludes the leadscrew for the same reason.
