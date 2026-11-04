---
id: "1dbdf725"
title: DC motors with encoders
type: solution
sources: ["LLM:claude-opus-5-5", "https://en.wikipedia.org/wiki/HP_7470", "https://www.bitsavers.org/pdf/hp/plotter/7475A/07475-90000_7475A_Service_Manual_198708.pdf"]
confidence: low
---
**Why choose it.** The drive of the classic office plotters (HP 7470 and 7475A): a DC motor with a quadrature encoder in a servo loop. Fast, smooth and quiet, and it knows where it is, so a disturbance is corrected instead of shifting the rest of the drawing.

**Tradeoffs.** Each axis needs a closed-loop controller and tuning. Hobby plotter firmware outputs step and direction pulses for steppers, so it needs a servo driver that accepts step and direction and closes the loop itself, which costs more than the motor.
