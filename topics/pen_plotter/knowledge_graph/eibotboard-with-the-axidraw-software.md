---
id: "d4ddcf72"
title: EiBotBoard with the AxiDraw software
type: solution
sources: ["LLM:claude-opus-5-5", "https://www.makerq.com/products/easydraw-v4-drawing-and-writing-machine-fully-assembled", "https://cdn.evilmadscientist.com/wiki/axidraw/software/AxiDraw_V37r1.pdf"]
confidence: low
summary: "The AxiDraw controller driven from Inkscape over USB: no G-code step, but tied to that software"
abbr: EBB
---
**Why choose it.** The EiBotBoard (EBB) is the small controller of the AxiDraw and its clones (the EasyDraw uses one): two stepper drivers and a servo output, driven over USB by the free AxiDraw extension for Inkscape. Draw in Inkscape and press Apply, with handwriting fonts, pause and resume, and no G-code step.

**Tradeoffs.** Tied to that software and to the kinematics it assumes, so a clone must match the AxiDraw layout. Few settings to tune. The EBB board costs more than an Uno clone with a shield.

**Links.** It excludes the Z-axis stepper lift: the board drives only two steppers and lifts the pen with its servo output.
