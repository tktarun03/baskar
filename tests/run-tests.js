// Runs the app's built-in self-check (the same one as Settings → Run self-check)
// in a headless browser and exits with code 1 if any check fails.
//
// Setup once:   npm install --no-save playwright && npx playwright install chromium
// Run:          node tests/run-tests.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.BasKarTest, null, { timeout: 15000 });
  const r = await page.evaluate(() => window.BasKarTest.run());
  for (const x of r.results.filter((x) => !x.ok)) {
    console.log(`FAIL  ${x.group} | ${x.name} | got ${JSON.stringify(x.got)}, expected ${JSON.stringify(x.want)}`);
  }
  for (const e of errors) console.log(`PAGE ERROR  ${e}`);
  console.log(`${r.pass} of ${r.total} checks passed`);
  await browser.close();
  process.exit(r.pass === r.total && !errors.length ? 0 : 1);
})();
