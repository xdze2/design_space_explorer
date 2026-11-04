---
id: "37a033a3"
title: Geared 28BYJ-48 steppers
type: solution
sources: ["LLM:claude-opus-5-5", "https://electricalflux.com/mcu-peripherals/28byj-48-stepper-motor-sizing-wiring", "https://www.instructables.com/DIY-Multicolor-Pen-Plotter/"]
confidence: low
---
**Why choose it.** Very cheap and tiny, with a gearbox that gives usable torque and fine resolution (about 2000 steps per output revolution). Common on budget builds, including a CoreXY plotter and a multi-pen changer.

**Tradeoffs.** Slow: about 15 rpm, and a GRBL build tops out near 5 mm/s. Plastic gears add backlash, and the real gear ratio is not the nominal one, so error accumulates over long moves. It is unipolar: CNC-shield drivers need a trace cut to run it bipolar. Overdriving it at 12 V gains torque and heat.
