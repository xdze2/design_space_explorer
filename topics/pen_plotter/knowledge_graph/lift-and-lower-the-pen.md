---
id: "2798fd6f"
title: Lift and lower the pen
type: function
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5", "https://lauda.ulapland.fi/bitstream/handle/10024/65132/Bircher_Martin.pdf"]
confidence: low
---
**Why it matters.** Pen pressure, tip compliance and a repeatable up and down travel affect line quality more than a small mechanical improvement of the axes. A pen that drags, skips or leaves dots at the end of strokes ruins an otherwise accurate drawing.

**Tradeoffs.** The simplest lifters are cheap but only know up and down. Servo, solenoid and Z-stepper lifts only move the pen, so each brings a sub-function that sets how hard it presses; a voice coil sets the force itself. Finer control costs extra parts, wiring and firmware support.
