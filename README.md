# MoM E1 Stimulus Generator

Browser tool that generates stimuli for **Mind Over Matter, Experiment 1** (LSU DMAE/VIS · Cognitive Science · MIE).

It follows the target relocation design in `Exp_Design_Spreadsheet_Final` (6 Nov 2026): 48 trials in 2 blocks of 24, with 8 No change, 8 Shifted, and 8 Shifted + recolored per block. The shifted conditions use each of the 8 directions once per block, and the No change trials use them as counterfactual shifts.

Each trial gives:

- a Phase 2 search image and a Phase 5 relocate image (grain field, one pure-black target, near-black decoys)
- a Phase 3 Kikuchi pattern
- one row in `trials.csv` / `trials.txt` (Experiment Builder data source) with the design-sheet columns, file names, and screen coordinates

## Use

Open the GitHub Pages site, adjust settings, then set the display and shift distance, then click **Generate all 48 trials (.zip)**. Optional: switch *Grain source* to a real micrograph and load it with its grain outline mask.

Everything runs locally in the browser; no data is uploaded.

## Coordinates

Screen pixels, origin top-left, y down. The `dx`/`dy` columns keep the sheet's convention (U = +1). See `README.txt` inside each exported zip for every column.
