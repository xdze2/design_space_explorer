---
title: FluidNC on ESP32
type: option
parent: controller
compatible_with: [pen-lift/servo, gantry/corexy]
sources: ["LLM:sonnet-5.5", "raw/DIY A3 pen plotter - Claude.md"]
confidence: low
---
**Why choose it.** Wi-Fi upload, configuration through a YAML file (including CoreXY kinematics) and native servo support. Takes standard G-code.

**Tradeoffs.** More configuration than GRBL on an Uno, and the ESP32 board and shield cost more.
