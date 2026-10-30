# MoM E1 Stimulus Generator

Browser tool that generates stimuli for **Mind Over Matter, Experiment 1** (LSU DMAE/VIS · Cognitive Science · MIE).

Each stimulus set contains:

- a base grain image with one pure-black target and near-black decoys
- snippet 1, snippet 2 (shifted on X, Y, or both), and snippet 2 + noise (miscalibrated shift)
- color-change versions of all four
- a diffraction line pattern
- one row in `stimuli.csv` with shift amounts, target coordinates, file names, and seeds

Batches balance shift types 50/50 (single axis vs. X and Y). Seeds make every set reproducible.

## Use

Open the GitHub Pages site, adjust settings, then click **Generate batch (.zip)**. Optional: switch *Grain source* to a real micrograph and load it with its grain outline mask.

Everything runs locally in the browser; no data is uploaded.

## Coordinates

Pixels, origin top-left. `view_dx`/`view_dy` = snippet 2 position minus snippet 1 position (the stage move). See `README.txt` inside each exported zip for every column.
