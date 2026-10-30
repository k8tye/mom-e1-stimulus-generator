# MoM E1 Stimulus Generator

Browser tool that generates visual stimuli for **Mind Over Matter (MoM), Experiment 1**, part of the EMSight project at LSU (DMAE/VIS, Cognitive Science, MIE). Owner: Kate Tye (GA, DMAE/VIS). Experiment design: Dr. Melissa Beck (Cognitive Science). Microscopy domain and source images: Dr. Christopher Marvel (MIE).

## Repo layout

- `index.html`: the entire app. One self-contained file with no build step. Must keep working in two hosts:
  - **GitHub Pages:** downloads use a plain `<a download>` blob link.
  - **Claude artifact:** downloads go through `window.claude.use("downloads")`. The detection is at the end of `init()`. Keep both paths.
- `tests/smoke.test.js`: Playwright smoke test (see Testing).
- `.nojekyll`: serves files as-is on Pages.
- Only external dependency: JSZip 3.10.1 from cdnjs (exact version pinned). Fonts are IBM Plex Sans and IBM Plex Mono from Google Fonts. Don't add a bundler or framework unless Kate asks.

## What the experiment needs (from Beck's task analysis and the 2026-10-29 meeting)

Each trial has three screens:

1. **Search:** the participant clicks the pure-black target in snippet 1.
2. **Diffraction:** the participant moves a diffraction line pattern into a red circle with the **arrow keys**. Experiment Builder (EB) draws the circle and moves the pattern image. The correct movement equals the view shift between snippets.
3. **Re-find:** the participant clicks the same target in snippet 2. The view has shifted, and in the color-change condition the grains are recolored. The question is whether they spatially update or just search again.

The design is 2×2 repeated measures, change type (Tr, Tr+C) × noise (absent, present), minimum 40 trials. Each participant does about 10–40 trials, so images must vary a lot (coarse to fine grains).

**Noise** means stage miscalibration: snippet 2 + noise is shifted by `gain × intended shift` (default gain 0.5–0.9, plus an optional ±px offset). It is not image noise. Surface texture (pixel noise, scratches, pits) is constant realism across all conditions.

### Stimulus set spec (one row in `stimuli.csv`)

1. **Base image:** size = snippet × 4 (default 250 → 1000 px). The black target is placed at least 200 px from the edges.
2. **Snippet 1:** a random window that fully contains the target.
3. **Shift:** half the sets move on a single axis (X or Y, chosen at random, split evenly); half move on both X and Y. The amount is random within the range that keeps the target fully inside, with a minimum shift (default 20% of the snippet).
4. **Snippet 2:** snippet 1 moved by the shift. **Snippet 2 + noise:** moved by the miscalibrated shift.
5. **Color change:** the same 4 images with every grain re-greyed. The target stays black and decoys keep their grey.
6. Totals: 8 images per set, plus a diffraction pattern (zone-axis center at the image center), plus a CSV row (shifts, target coordinates per image, file names, seeds).

Only the target may be pure black (value 0). Decoys are near-black (default grey 38) so screen 1 needs real visual search rather than pop-out. **Beck will tune the decoy grey by eye.**

Coordinates are pixels with the origin at the top-left. `view_dx = s2_x - s1_x`. On screen the target moves by the negative of the view shift.

### Decisions log

- J1: procedural engine plus an optional real-micrograph mode. Real mode takes the image and its grain outline mask; uncompressed TIFF, PNG, and JPG work; the SEM data bar is auto-trimmed.
- J2: first trials run in SR Research **Experiment Builder** in Beck's lab. Later they move to **WorldViz + PiMAX**. The tool pre-generates files; nothing is generated live.
- J3: the tool also generates the screen-2 diffraction pattern (one image per set).
- J4: near-black decoys are used. Default style is blobs, which look like the target; a "dark grains" style is available.
- M1: Marvel granted permission to use his micrographs. M2: span coarse to fine grain sizes.
- Atomic-resolution lattice images (Task 3, focusing) are **deferred**.

### Open items (do not block code)

- Display resolution and viewing distance for EB (sets the final snippet size).
- Confirm the noise gain range with Beck (current default is undershoot only, 0.5–0.9).
- Confirm the decoy grey after viewing batches.
- Who builds the EB experiment (Beck's lab, Tom, or Creighton): rename CSV columns to match their data source if needed.
- Should the Tr+C condition show recolored snippet 1 or the original? Both are exported.

## Code map (`index.html` script)

- RNG and noise: `mulberry32`, `hmix`, `h2`, `vnoise`. All randomness is seeded and deterministic.
- Four seeds: `shape` (grain layout, twins, texture), `color` (grey tables), `place` (target, decoys, snippet 1, shift), and `noise` (gain). Each can be locked. In batches, set *i* uses `derive(seed, i)` for unlocked seeds.
- `buildProceduralField`: dart-throwing with variable radii, then a power diagram with domain warp, then twin bands and texture.
- `buildReal` and `buildRealField`: mask labeling, then a crop/zoom of the real image. Texture is the residual from each grain's mean.
- `baseGreys`, `recolorGreys`, `compose`: the composed image is clamped to a floor so distractors never go darker than decoys.
- `place`: target, decoys, the snippet-1 bounds, the shift, and the noise. `batchTypes`: the 50/50 balancing.
- `buildDiffraction`: Kikuchi-style band pattern.
- Export: `runExport`, `csvRow`, `setJSON`, `README` (copied into every zip).

## Testing

`node tests/smoke.test.js` needs `npm i -D playwright jszip` and then `npx playwright install chromium`. The test checks:

- Over 40 sets, the target is fully inside snippet 1, snippet 2, and snippet 2 + noise.
- No pure-black pixels exist outside the target.
- Shift types are balanced 20/10/10.
- A single-set zip downloads.

Run it after any engine change.

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
