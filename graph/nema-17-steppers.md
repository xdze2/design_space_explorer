---
id: "ddbfc16b"
title: NEMA 17 steppers
type: solution
sources: ["LLM:claude-opus-5-5", "https://www.makerq.com/products/easydraw-v4-drawing-and-writing-machine-fully-assembled", "https://electricalflux.com/mcu-peripherals/28byj-48-stepper-motor-sizing-wiring"]
confidence: low
summary: "The standard step-and-direction motor: 200 steps per turn, good torque and speed, open loop"
---
**Why choose it.** The standard plotter and 3D-printer motor: 200 full steps per revolution, microstepped, run by step-and-direction drivers that every hobby firmware supports. Plenty of torque and speed for a pen carriage. Most kits use them, the EasyDraw V4 among them.

**Tradeoffs.** Open loop: an overload or a bind skips steps silently. Heavy when one rides on the gantry. Noisy on basic drivers; quiet drivers cost a little more. Closed-loop versions with an encoder on the back keep the same step-and-direction interface for a modest premium. After a skipped step the rest of the drawing is shifted, which spoils repeatability.
