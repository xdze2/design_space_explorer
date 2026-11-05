---
id: "5249fcf9"
title: FluidNC on ESP32
type: solution
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5"]
confidence: low
summary: "An ESP32 running FluidNC: wireless upload, text-file configuration and native servo support"
abbr: FNC
---
**Why choose it.** Wireless upload, configuration through a text file (including CoreXY kinematics and a second motor ganged on one axis) and native servo support. It takes standard G-code.

**Tradeoffs.** More configuration than GRBL on an Uno, and the ESP32 board and its driver shield cost more.
