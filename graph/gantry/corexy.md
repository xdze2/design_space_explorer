---
title: CoreXY
type: option
parent: gantry
requires: [drive/gt2-belt]
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Both motors are fixed at the rear corners, so the moving mass is minimal and acceleration can be very high. Both ends of the beam are driven, so racking is low. Kinematics: X = (A+B)/2, Y = (A-B)/2. GRBL supports it as a compile option, FluidNC through its kinematics config.

**Tradeoffs.** It needs 10 to 14 idlers and 4 to 6 m of belt, and equal tension and equal path length on both belts, or drawings skew and circles turn into ovals. Both belts should sit level. A square, rigid frame is not optional. It adds about $15 to 25 to the BOM.

**Constraints.** It requires a belt drive (`drive/gt2-belt`): the two-belt kinematics cannot be built with screws.
