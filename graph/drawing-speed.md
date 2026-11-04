---
id: "d0784b3e"
title: Drawing speed
type: constraint
sources: ["LLM:claude-opus-5-5", "https://stefan.wtf/p/penplotter", "https://electricalflux.com/mcu-peripherals/28byj-48-stepper-motor-sizing-wiring"]
confidence: low
---
**The limit.** How long a drawing may take. Drawings are many short segments and corners, so the time is set by acceleration and by how fast the pen lifts and drops between strokes, not by top speed. The ink also sets a limit: a pen drawn too fast skips.

**How solutions fare.** Layouts with fixed motors and a light carriage (CoreXY, H-bot) accelerate best; a motor riding on the gantry, a leadscrew, geared steppers or a swinging polargraph gondola are slow. Solenoids and voice coils lift fastest, servos are moderate and Z steppers slower; a gravity drop can bounce at high speed. The acceptable drawing time belongs to a design document, not to the graph.
