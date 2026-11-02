---
name: baskar-release
description: Ship any change to BasKar. Covers the version bump, the in-app version history (RELEASES), CHANGELOG.md, tests, commit, push to main and checking the GitHub Pages deploy. Use for every change that reaches users, however small.
---

# Ship a BasKar release

`main` is production: GitHub Pages deploys it in about a minute. Every change that reaches users is a release and gets a version history entry.

## 1. Pick the version

- **Minor** (1.7 → 1.8): new features or behaviour users will notice.
- **Patch** (1.7 → 1.7.1): fixes, copy changes, translations.

## 2. Update the in-app history

In `js/core/releases.js`, add a new entry **at the top** of `RELEASES`:

```js
{ v: '1.8', date: '9 Nov 2026', notes: [
  'Plain sentence about what changed, written for users',
  'Fixed: what was wrong, in user terms'
] },
```

- `date` is `D Mon YYYY` with an English month.
- Write notes for users, not developers. Start fixes with "Fixed:".
- `APP_VERSION` is derived from `RELEASES[0]`. Don't edit it.
- The "What's new" notice shows the first entry once per device.

## 3. Bump the file versions

Every CSS and JS link in `index.html` ends in `?v=<version>`. Change all of them to the new version in one go:

```bash
sed -i 's/?v=1\.8/?v=1.9/g' index.html     # old → new
```

Without this, iPhones can keep cached old scripts next to the new page. The tests fail if any link doesn't match `RELEASES[0].v`.

## 4. Update `CHANGELOG.md`

Add the same entry at the top, under `## 1.8 · 9 Nov 2026`, as a bulleted list. It may hold extra developer detail, such as the test count.

## 5. Translate new text

Every new or changed English string needs a row in `BASKAR_I18N_ROWS`. Follow `.claude/skills/baskar-translate/SKILL.md`. Notes inside `RELEASES` are not translated.

## 6. Test

```bash
node tests/run-tests.js          # must print "Structure OK" and "N of N checks passed", and exit 0
```

Also check by hand at 375px width, in English and in Arabic (right-to-left):

- No horizontal scroll.
- The sheet header stays fixed while the body scrolls.
- Toasts appear above the tab bar.

If you have Playwright, take screenshots with `isMobile: true` and look at them.

## 7. Commit and push

```bash
git add -A
git commit -m "Release 1.8: <one-line summary>"
git push origin main
```

Never force-push `main`.

## 8. Confirm the deploy

```bash
gh api repos/tktarun03/baskar/actions/runs --jq '.workflow_runs[0] | "\(.head_sha[0:7]) \(.status) \(.conclusion)"'
```

Wait until the run for your commit shows `completed success`. Then open https://tktarun03.github.io/baskar/ and check that Settings → Version history shows the new version.

## Done when

- `RELEASES[0]`, every `?v=` in `index.html` and the top of `CHANGELOG.md` show the same version.
- The tests pass.
- The Pages run succeeded and the live site shows the version.
