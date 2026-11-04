---
id: "328cfb43"
title: H-bot
type: solution
sources: ["LLM:claude-opus-5-5", "https://hackaday.com/2016/02/29/design-analysis-core-xy-vs-h-bot/", "https://kylepls.com/plot"]
confidence: low
---
**Why choose it.** Both motors are fixed, as in CoreXY, but a single belt runs in an H with no crossing and no stacked planes: simpler to route and hard to get wrong. Common on AxiDraw-style clones and fast hobby plotters. The motor mixing is the same as CoreXY, so firmware's CoreXY option drives it.

**Tradeoffs.** The belt pulls the moving beam off-centre, which twists it at every move (racking), so the beam and its guides must be stiff. A long single belt stretches more. It brings the drive, the transmission, the guides and a way to hold the surface.

**Links.** It requires the GT2 belt drive and excludes the leadscrew: the kinematics are made by a belt loop.
