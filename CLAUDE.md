# MoM E1 Stimulus Generator

Browser tool that generates visual stimuli for **Mind Over Matter (MoM), Experiment 1**, part of the EMSight project at LSU (DMAE/VIS, Cognitive Science, MIE). Owner: Kate Tye (GA, DMAE/VIS). Experiment design: Dr. Melissa Beck (Cognitive Science). Microscopy domain and source images: Dr. Christopher Marvel (MIE).

## Repo layout

- `index.html`: the entire app. One self-contained file with no build step. Must keep working in two hosts:
  - **GitHub Pages:** downloads use a plain `<a download>` blob link.
  - **Claude artifact:** downloads go through `window.claude.use("downloads")`. The detection is at the end of `init()`. Keep both paths.
- `tests/smoke.test.js`: Playwright smoke test (see Testing).
- `.nojekyll`: serves files as-is on Pages.
- Only external dependency: JSZip 3.10.1 from cdnjs (exact version pinned). Fonts are IBM Plex Sans and IBM Plex Mono from Google Fonts. Don't add a bundler or framework unless Kate asks.

## Current design: Exp_Design_Spreadsheet_Final (Creighton, 6 Nov 2026)

This supersedes the earlier 2x2 (Tr / Tr+C x noise) design. **Control noise was removed on 5 Nov 2026.**

- One within-subjects factor, Condition: No change (baseline), Shifted, Shifted + recolored.
- 48 trials = 2 blocks x 24. Per block, each condition has 8 trials.
  - The two shifted conditions use the 8 directions once each (L, R, U, D, LU, LD, RU, RD).
  - No change trials use the same 8 directions as counterfactual shifts, for scoring first fixations.
  - Order within a block is randomized per participant at run time in Experiment Builder (EB).
- Every trial runs these phases:
  - Phase 0: drift check.
  - Phase 1: fixation cross, then click.
  - Phase 2: find and click the darkest grain.
  - Phase 3: Kikuchi centering. Arrow keys move the zone axis to a crosshair, with the same offset on every trial.
  - Phase 4: fixation cross, then click.
  - Phase 5: relocate the target. All dependent measures come from this phase.
- The shift distance equals the centering offset, in degrees of visual angle (still TO SET).
- The minimum old-to-new separation and the ROI radius (target edge + about 1.5 deg) are also still TO SET.
- `TRIALS` (from `buildTemplate()`) reproduces the Trials sheet row for row. The export starts with the sheet's exact columns, then adds file names and screen-pixel coordinates.

### Conventions the tool assumes (confirm with Creighton)

- **Direction means the way the image moves on screen.** For example, L means the target appears further left in Phase 5. A setting flips this so the direction names the stage/view move instead.
- **Two-axis shifts move the full distance on each axis**, which matches dx = +/-1, dy = +/-1 in the sheet. A setting changes this to the full distance along the diagonal.
- **No change trials** get a centering offset that follows their counterfactual direction.
- **Screen layout:** the image is drawn centered on screen and the crosshair sits at screen center. `Diff_Start` = crosshair minus the centering move.
- **Data source file:** `trials.txt` (tab-delimited) uses "NA" where the sheet has "—", to keep the file ASCII. `trials.csv` keeps "—".
- **Display defaults are placeholders** (1920x1080, 53.1 cm, 70 cm, 46.2 px/deg). Set them to the EyeLink lab display.

### Earlier decisions still in force

- Procedural grains, plus an optional real-micrograph mode that takes Marvel's image and mask (Marvel granted permission).
- The target is the only pure-black region. Decoys are near-black blobs; Beck tunes the decoy grey by eye.
- Images are pre-generated for EB now; WorldViz + PiMAX come later.
- Atomic-lattice images (Task 3) are deferred.

## Code map (`index.html` script)

- RNG and noise: `mulberry32`, `hmix`, `h2`, `vnoise`. All randomness is seeded and deterministic.
- Three seeds: `shape`, `color`, and `place`. Each can be locked. Trial *n* uses `derive(seed, n)` for unlocked seeds, and trial 1 uses the seed itself.
- `buildProceduralField`: dart-throwing with variable radii, then a power diagram with domain warp, then twin bands and texture.
- `buildReal` and `buildRealField`: mask labeling, then a crop/zoom of the real image. Texture is the residual from each grain's mean.
- `baseGreys`, `recolorGreys`, `compose`: the composed image is clamped to a floor so distractors never go darker than decoys.
- `moveFor(dir)`: direction to screen move. `placeTrial`: target, decoys, and the Phase 2 and Phase 5 windows, plus the counterfactual window. `generateTrial`, `trialGeometry`, `exportRow`: the EB columns.
- `buildDiffraction`: Kikuchi-style band pattern.
- Export: `runExport`, `toDelim` (csv + tab-delimited txt), `trialJSON`, `README` (copied into every zip).

## Testing

`node tests/smoke.test.js` needs `npm i -D playwright jszip` and then `npx playwright install chromium`. The test checks:

- There are 48 trials, with 8 per condition per block.
- Net dx and dy are both 0.
- The target fits inside every window, including the counterfactual window.
- Shift directions are correct, and No change trials don't move.
- Every image contains the target.
- A single-trial zip downloads.

## Sample data

Marvel's micrographs are on Kate's machine at `D:\User\Documents\LSU\Doctorate\GrainImage\GrainImage`. Don't commit them. The best masks for real mode are the full-frame ones in `12at% 0.5Tm/Day 3/{06,10,12,16}/Mask of NN outline.tif`, paired with the TIF in the same folder.

## Publishing

On Windows, install the GitHub CLI with `winget install --id GitHub.cli`, then run `gh auth login`.

```
git init -b main && git add . && git commit -m "Initial commit: MoM E1 stimulus generator"
gh repo create mom-e1-stimulus-generator --public --source=. --remote=origin --push
gh api -X POST repos/{owner}/mom-e1-stimulus-generator/pages -f "source[branch]=main" -f "source[path]=/"
```

The site goes live at `https://<user>.github.io/mom-e1-stimulus-generator/`. The Claude artifact version is a separate copy, so tell Kate if the two diverge.

## Roadmap ideas (only when asked)

- Difficulty presets.
- Optional SEM info bar with a scale bar.
- An Experiment Builder–ready tab-delimited export.
- A WorldViz/Vizard export.
- Lattice and defocus-series generator for Task 3.
