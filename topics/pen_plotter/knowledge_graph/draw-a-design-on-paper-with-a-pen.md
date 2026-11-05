---
id: "55269563"
title: "Draw a design with a pen or brush"
type: function
sources: ["LLM:claude-sonnet", "LLM:claude-opus-5-5", "https://lostpixels.io/writings/the-difference-between-plotted-and-printed-artwork", "https://en.wikipedia.org/wiki/Plotter"]
confidence: low
---
**Why it matters.** This is the reason the machine exists: take a vector drawing and reproduce it on a flat surface with a real pen or brush, repeatably and without a human hand. It is not a printer. A printer lays down a grid of ink droplets and mixes colours to copy a file; a plotter drags a tool along continuous strokes. The plotted line is not sharper than a good inkjet print at normal viewing distance. What differs is the physical stroke: the pen's own ink and texture, a slight embossing of the paper, inks a printer does not have (white gel pen on black paper, metallic or archival inks), and supports a printer cannot take, such as heavy paper, card or wood. The price is speed: a plot is orders of magnitude slower than a print, and solid fills and gradients are hard.

**Tradeoffs.** The job splits into four parts that pull against each other: moving the pen in the plane, touching and leaving the surface cleanly, changing pens for colour, and turning a file into motor motion. Guiding the axes, driving them and holding the surface are not parts of their own: they belong to the way the pen is moved, so each layout brings the ones it needs. In practice, line quality comes more from rigidity, play removal and the pen interface than from any single component choice, so a cheap part that is mounted well beats an expensive one that is not.
