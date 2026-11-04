---
id: "fba1701e"
title: Voice coil pen actuator
type: solution
sources: ["LLM:claude-opus-5-5", "https://lauda.ulapland.fi/bitstream/handle/10024/65132/Bircher_Martin.pdf", "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4567565"]
confidence: low
summary: "A moving coil gives a force proportional to current, so the pen pressure can change during a stroke"
---
**Why choose it.** A moving coil in a magnet gives a force proportional to current and nearly independent of position. The pressure can be set per pen and changed during a stroke, which varies the stroke weight with a brush or a flexible nib. Office plotters used it against a spring. It sets the pressure itself, so it brings no pressure sub-function.

**Tradeoffs.** Rare in DIY builds: it needs a current driver, an analog or PWM output and firmware that maps a value to a force. Short stroke, more cost and tuning. It lifts about as fast as a solenoid.
