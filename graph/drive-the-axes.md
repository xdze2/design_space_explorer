---
id: "7279c5e2"
title: Drive the axes
type: function
sources: ["LLM:claude-opus-5-5", "https://electricalflux.com/mcu-peripherals/28byj-48-stepper-motor-sizing-wiring", "https://www.bitsavers.org/pdf/hp/plotter/7475A/07475-90000_7475A_Service_Manual_198708.pdf"]
confidence: low
---
**Why it matters.** Something has to turn. The motor sets the torque available for acceleration, the positional resolution, and whether a lost step is noticed. A plotter with open-loop motors has no feedback: a step skipped on a bind shifts the rest of the drawing.

**Tradeoffs.** Cheap motors (geared steppers, hobby servos) are slow or imprecise. Closed-loop motors correct drift but need other drivers and firmware. A pen load is light, so torque is rarely the limit; speed under load, resolution and play are. Every layout brings this function and shares the choice.
