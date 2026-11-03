---
title: Single-rail cantilever (AxiDraw style)
type: option
parent: gantry
compatible_with: [linear-guide/mgn12-rails, drive/gt2-belt]
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** One Y rail along one side carries a cantilevered X beam. There is no parallelism to get right, no racking, a single belt and motor, less extrusion and moving mass, and one side stays open for loading paper or odd-shaped media. Many commercial pen plotters work this way.

**Tradeoffs.** The load sits off the rail, so the carriage sees a tilting moment: beam sag and twist, higher wheel loads and a lower resonance, which limits acceleration. It needs a wide carriage (4+ wheels or two bearing blocks), a stiff beam (2040 or a box section rather than 2020) and a short overhang. With 2020, a 300+ mm overhang flexes noticeably, which matters at A3.
