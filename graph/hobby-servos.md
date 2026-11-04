---
id: "0800f202"
title: Hobby servos
type: solution
sources: ["LLM:claude-opus-5-5", "https://hackaday.com/2014/02/13/a-clock-that-plots-time/", "https://github.com/IljaRukin/scara_plotter"]
confidence: low
summary: "A hobby servo sets an angle from a pulse width: the cheapest motor, but coarse and limited to under one turn"
---
**Why choose it.** The cheapest motor of all, and it needs no driver: a pulse width sets an angle. Two of them drive a five-bar arm directly, as in the PlotClock.

**Tradeoffs.** Coarse resolution, a deadband and gear backlash: lines wobble, a chessboard pattern shows the error, and each servo needs calibrating at several angles. It turns through less than one revolution, and continuous-rotation servos give up position control. Its deadband and backlash also mean it does not return to exactly the same point.

**Links.** It excludes the GT2 belt drive and the leadscrew: both need the motor to turn many revolutions over the length of an axis, which a positional servo cannot do. So on any layout that brings a transmission it is a conflict; it only fits an arm.
