// BasKar tests.
// 1. Structure: every app file is loaded by index.html (and vice versa), all on one ?v= version that matches
//    js/core/releases.js, and no top-level name is defined twice (all files share one global scope).
// 2. The app's built-in self-check (the same one as Settings → Run self-check) in headless Chromium.
// Exits with code 1 if anything fails.
//
// Setup once:   npm install --no-save playwright && npx playwright install chromium
// Run:          node tests/run-tests.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const problems = [];

// ---- 1. Structure
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)\?v=([^"]+)"/g)].map((m) => ({ file: m[1], v: m[2] }));
const unversioned = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)"/g)].map((m) => m[1]);
unversioned.forEach((f) => problems.push(`index.html loads ${f} without ?v=`));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}
const onDisk = [...walk(path.join(ROOT, 'js')), path.join(ROOT, 'css', 'app.css')].map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
const loaded = refs.map((r) => r.file);
onDisk.filter((f) => !loaded.includes(f)).forEach((f) => problems.push(`${f} exists but index.html doesn't load it`));
loaded.filter((f) => !onDisk.includes(f)).forEach((f) => problems.push(`index.html loads ${f}, which doesn't exist`));

const relSrc = fs.readFileSync(path.join(ROOT, 'js/core/releases.js'), 'utf8');
const current = (relSrc.match(/v: '([^']+)'/) || [])[1];
const badV = refs.filter((r) => r.v !== current);
if (badV.length) problems.push(`These files are not on ?v=${current} (the version in js/core/releases.js): ${badV.map((r) => r.file + '?v=' + r.v).join(', ')}`);
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes(`## ${current} ·`)) problems.push(`CHANGELOG.md has no "## ${current} · …" entry`);

const order = loaded.filter((f) => f.endsWith('.js'));
if (order[order.length - 1] !== 'js/app/boot.js') problems.push('js/app/boot.js must be the last script in index.html');

const owner = {};
for (const f of order) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (f !== 'js/i18n-rows.js' && !/^\/\* BasKar · /.test(src)) problems.push(`${f} should start with the "/* BasKar · ${f}" header comment`);
  if (f !== 'js/i18n-rows.js' && !/\n'use strict';\n/.test(src)) problems.push(`${f} is missing 'use strict';`);
  for (const m of src.matchAll(/^(?:function\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*))/gm)) {
    const name = m[1] || m[2];
    if (owner[name] && owner[name] !== f) problems.push(`"${name}" is defined at top level in both ${owner[name]} and ${f}`);
    else owner[name] = f;
  }
}

if (problems.length) {
  problems.forEach((p) => console.log('STRUCTURE  ' + p));
} else {
  console.log(`Structure OK: ${order.length} scripts + css on v${current}, ${Object.keys(owner).length} top-level names, no clashes`);
}

// ---- 2. Built-in self-check
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.BasKarTest, null, { timeout: 15000 });
  const r = await page.evaluate(() => window.BasKarTest.run());
  for (const x of r.results.filter((x) => !x.ok)) {
    console.log(`FAIL  ${x.group} | ${x.name} | got ${JSON.stringify(x.got)}, expected ${JSON.stringify(x.want)}`);
  }
  for (const e of errors) console.log(`PAGE ERROR  ${e}`);
  console.log(`${r.pass} of ${r.total} checks passed`);
  await browser.close();
  process.exit(r.pass === r.total && !errors.length && !problems.length ? 0 : 1);
})();
