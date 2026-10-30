// Smoke test for index.html. Setup: npm i -D playwright jszip && npx playwright install chromium
// Run: node tests/smoke.test.js
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");

(async () => {
  const root = path.join(__dirname, "..");
  // Use the local JSZip so the test runs offline
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
    await page.waitForFunction(() => document.getElementById("genStatus").textContent.startsWith("Ready"), null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const types = batchTypes(40, seeds.place); let outside = 0, zeros = 0;
      for (let i = 0; i < 40; i++) {
        const sd = {}; for (const k in seeds) sd[k] = derive(seeds[k], i);
        const s = generateSet(sd, types[i], i + 1), pl = s.pl, S = s.S, R = pl.target.blob.Rmax, B = s.B;
        for (const sn of [pl.s1, pl.s2, pl.s2n]) {
          const x = pl.target.x - sn.x, y = pl.target.y - sn.y;
          if (x - R < 0 || y - R < 0 || x + R > S || y + R > S || sn.x < 0 || sn.y < 0 || sn.x + S > B || sn.y + S > B) outside++;
        }
        for (const key of ["base", "base_cc"]) { const im = s.imgs[key];
          for (let j = 0; j < B * B; j++) if (im[j] === 0 && Math.hypot(j % B - pl.target.x, ((j / B) | 0) - pl.target.y) > R + 1.5) zeros++; }
      }
      return { outside, zeros, xy: types.filter(t => t === "XY").length, x: types.filter(t => t === "X").length, y: types.filter(t => t === "Y").length };
    });
    check(r.outside === 0, `target inside all snippets (${r.outside} violations)`);
    check(r.zeros === 0, `no pure black outside target (${r.zeros} px)`);
    check(r.xy === 20 && r.x === 10 && r.y === 10, `balanced shift types XY ${r.xy} / X ${r.x} / Y ${r.y}`);
    await page.waitForTimeout(3500);
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("#saveSet")]);
    check(/\.zip$/.test(dl.suggestedFilename()), "single-set zip downloads");
    check(errors.length === 0, "no page errors " + errors.join("; "));
  } finally { await browser.close(); fs.unlinkSync(tmp); }
  process.exit(failed ? 1 : 0);
})();
