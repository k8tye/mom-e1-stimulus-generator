// Smoke test for index.html (48-trial design). Setup: npm i -D playwright jszip && npx playwright install chromium
// Run: node tests/smoke.test.js
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

(async () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8")
    .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jszip\/[^"]+/, "node_modules/jszip/dist/jszip.min.js");
  const tmp = path.join(root, ".smoke.html");
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  let failed = false;
  const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failed = true; };
  try {
    await page.goto("file://" + tmp);
    await page.waitForFunction(() => /Ready|Needs/.test(document.getElementById("genStatus").textContent), null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const bad = []; const rows = [];
      for (const row of TRIALS) {
        const t = generateTrial(row), g = trialGeometry(t), pl = t.pl, S = t.S, R = pl.target.blob.Rmax;
        for (const [nm, w] of [["phase2", pl.s1], ["phase5", pl.s2], ["counterfactual", pl.cf]]) {
          if (!w) continue; const x = pl.target.x - w.x, y = pl.target.y - w.y;
          if (x - R < 0 || y - R < 0 || x + R > S || y + R > S || w.x < 0 || w.y < 0 || w.x + S > t.B || w.y + S > t.B) bad.push(row.Trial_ID + " " + nm + " window");
        }
        const u = DIRS[pl.moveDir], to = row.Shift_Applied ? g.now : g.cf;
        if (Math.sign(to.x - g.old.x) !== u[0] || Math.sign(to.y - g.old.y) !== -u[1]) bad.push(row.Trial_ID + " direction");
        if (!row.Shift_Applied && (g.now.x !== g.old.x || g.now.y !== g.old.y)) bad.push(row.Trial_ID + " no-change moved");
        for (const im of [t.imgs.search, t.imgs.relocate]) { let mn = 255; for (const v of im) if (v < mn) mn = v; if (mn !== 0) bad.push(row.Trial_ID + " target missing"); }
        rows.push(row);
      }
      const count = (f) => rows.filter(f).length;
      return { bad, n: rows.length,
        perCond: ["No change", "Shifted", "Shifted + recolored"].map(c => [1, 2].map(b => count(r => r.Block === b && r.Condition === c))).flat(),
        sumdx: rows.reduce((a, r) => a + r.dx, 0), sumdy: rows.reduce((a, r) => a + r.dy, 0) };
    });
    check(r.n === 48, `48 trials (${r.n})`);
    check(r.perCond.every(v => v === 8), `8 per condition per block (${r.perCond})`);
    check(r.sumdx === 0 && r.sumdy === 0, `net displacement 0 (dx ${r.sumdx}, dy ${r.sumdy})`);
    check(r.bad.length === 0, `target inside every window, directions and no-change correct ${r.bad.join("; ")}`);
    await page.waitForTimeout(3500);
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#saveSet")]);
    check(/\.zip$/.test(dl.suggestedFilename()), "single-trial zip downloads");
    check(errors.length === 0, "no page errors " + errors.join("; "));
  } finally { await browser.close(); fs.unlinkSync(tmp); }
  process.exit(failed ? 1 : 0);
})();
