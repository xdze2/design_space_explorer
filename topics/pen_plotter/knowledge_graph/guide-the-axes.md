---
id: "b6e812c9"
title: Guide the axes
type: function
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5"]
confidence: low
---
**Why it matters.** The guide defines how much play and friction each axis has. Removing play while keeping smooth motion is the main skill of the build: too tight binds and loses steps (and a plotter has no feedback to notice), too loose gives wobbly lines.

**Tradeoffs.** Cheap guides need adjustment and are less stiff. Precision rails cost more and need flatter mounting surfaces. Every gantry layout needs it, so Cartesian, CoreXY, the H-bot, the single-rail cantilever and the grit-wheel carriage each bring this function (it is shared, and picking a solution for it applies to all of them); the arm and the polargraph have no guides. The layout sets the loads the guides must take: a cantilever puts a tilting moment on the guide, an H-bot twists its beam, a two-rail layout needs two parallel rails. The guide in turn limits how far the layout can be pushed.
