/**
 * Visual capture harness.
 *
 * The site's motion is almost entirely scroll-linked: sections are painted from
 * custom properties fed by a scroll container, not by wall-clock time. A
 * screenshot therefore has to actually scroll the container and wait for the
 * rAF lerps to converge, otherwise every reveal is captured mid-flight (or not
 * started) and the shot is worthless for judging the motion.
 *
 *   node scripts/shoot.mjs [url] [outDir] [--mobile] [--reduced]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const URL = positional[0] ?? 'http://localhost:5173';
const OUT = positional[1] ?? '.screens';
const MOBILE = flags.has('--mobile');
const REDUCED = flags.has('--reduced');

/**
 * Capture points, derived from SECTION_RANGES in src/App.jsx.
 *
 * `sp` is chosen per chapter to land after its last reveal completes but before
 * its exit fade begins — a chapter is only reviewable in that window. A single
 * global value can't do this: Hero finishes revealing at 0.80 and starts fading
 * at 0.85, Contact has no exit fade at all, and capturing any of them too deep
 * yields a screenshot of a section that has already dimmed to near zero.
 *
 * The `reveals` field is the last progress value that chapter reveals by; the
 * harness uses it only for reporting.
 */
const CHAPTERS = [
  { id: 'hero', sel: '.hero-section', start: 0.0, end: 0.15, sp: 0.83, reveals: 0.80 },
  { id: 'about', sel: '.about-section', start: 0.15, end: 0.31, sp: 0.895, reveals: 0.89 },
  { id: 'skills', sel: '.skills-section', start: 0.31, end: 0.48, sp: 0.83, reveals: 0.82 },
  { id: 'achievements', sel: '.achievements-section', start: 0.48, end: 0.62, sp: 0.97, reveals: 0.86 },
  { id: 'projects', sel: '.projects-section', start: 0.62, end: 0.82, sp: 0.99, reveals: 1.0 },
  { id: 'contact', sel: '.contact-section', start: 0.82, end: 1.0, sp: 0.99, reveals: 0.70 },
];

const at = (c, sp) => c.start + sp * (c.end - c.start);

const STOPS = [
  ...CHAPTERS.map((c) => ({ ...c, progress: at(c, c.sp), kind: 'settled' })),
  // Mid-reveal samples: useful for seeing the wipe/3D-turn in flight.
  ...(flags.has('--mid')
    ? [
        { ...CHAPTERS[0], sp: 0.5, progress: at(CHAPTERS[0], 0.5), kind: 'mid' },
        { ...CHAPTERS[4], sp: 0.5, progress: at(CHAPTERS[4], 0.5), kind: 'mid' },
      ]
    : []),
];

/**
 * Scroll to an absolute progress point and wait for the app to actually settle.
 *
 * The document is the scroller (`.comic-scroll` is a tall wrapper that merely
 * gives the page its ~19800px of scroll length). `behavior: instant` defeats the
 * site's smooth-scroll CSS, which would otherwise still be gliding.
 *
 * Waiting on `scrollTop` alone is not enough: the app lerps its own progress
 * toward the scroll target, so scrollTop can be parked while the rendered
 * reveals are still catching up. Waiting on scrollTop produced captures with
 * ~10% of a reveal still wiped. So wait on the thing being rendered.
 */
async function scrollToProgress(page, progress) {
  const target = await page.evaluate((p) => {
    const de = document.documentElement;
    const max = de.scrollHeight - de.clientHeight;
    window.scrollTo({ top: max * p, behavior: 'instant' });
    return max * p;
  }, progress);

  await page.waitForFunction(
    (top) => {
      const de = document.documentElement;
      if (Math.abs(de.scrollTop - top) > 2) return false;
      return true;
    },
    target,
    { timeout: 10000, polling: 100 }
  );

  // Now wait for every --p custom property on the page to stop changing.
  await page.waitForFunction(
    () => {
      const sample = [...document.querySelectorAll('[style*="--p"]')]
        .map((el) => el.style.getPropertyValue('--p'))
        .join('|');
      const prev = window.__lastSample;
      window.__lastSample = sample;
      return prev !== undefined && prev === sample;
    },
    null,
    { timeout: 10000, polling: 150 }
  );

  // Scroll-linked lerps are settled; the CSS transitions are real time-based,
  // so give them a short tail to land. Kept generous because the app's progress
  // is lerped internally and only reaches React's rendered inline styles on its
  // own rAF tick -- a short wait captures reveals a frame or two behind.
  await page.waitForTimeout(2000);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: REDUCED ? 'reduce' : 'no-preference',
});
const page = await context.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));

await mkdir(OUT, { recursive: true });

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

// The loading screen force-completes after 10s; wait for it to unmount.
await page.waitForSelector('.comic-loading-screen', {
  state: 'detached',
  timeout: 45000,
});
await page.waitForTimeout(1500);

const problems = [];
const suffix = `${MOBILE ? '-mobile' : ''}${REDUCED ? '-reduced' : ''}`;

/**
 * Flag any element whose reveal has not finished.
 *
 * The wipe is `clip-path: inset(0 calc(100% - p*100%) 0 0)`, so the *right*
 * inset is the amount still hidden. When that reaches 0 the element is fully
 * revealed; anything above 0 is still being wiped.
 */
async function auditReveals(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('[style*="--p"]')) {
      const clip = getComputedStyle(el).clipPath;
      if (clip === 'none') continue;
      const m = clip.match(/inset\(([^)]*)\)/);
      if (!m) continue;
      const parts = m[1].trim().split(/\s+/);
      const right = parts[1] ?? '0';
      const pct = parseFloat(right);
      // Non-zero right inset => still being wiped. Tolerance is 2%: below that
      // the seam is sub-pixel at 1440px and reads as fully revealed, and
      // flagging it only produces noise the reader can't act on.
      if (!Number.isNaN(pct) && pct > 2) {
        const raw = getComputedStyle(el).getPropertyValue('--p').trim();
        out.push({
          cls: el.className.toString().slice(0, 44),
          p: raw === '' ? 'n/a' : raw,
          right,
        });
      }
    }
    return out;
  });
}

for (const stop of STOPS) {
  await scrollToProgress(page, stop.progress);
  const file = path.join(OUT, `${stop.id}${stop.kind === 'mid' ? '-mid' : ''}${suffix}.png`);
  await page.screenshot({ path: file });

  // Snapshot this chapter's own classes once, so the reveal audit below can ask
  // "is an element of THIS chapter still wiped?" without string-prefix guessing.
  stop.inChapter = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    const own = [];
    root.querySelectorAll('[style*="--p"]').forEach((el) => {
      own.push(el.className.toString().split(/\s+/)[0]);
    });
    return own;
  }, stop.sel);

  const state = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'SELECTOR NOT FOUND';
    const s = getComputedStyle(el);
    return `opacity=${(+s.opacity).toFixed(2)} transform=${s.transform}`;
  }, stop.sel);

  const stuck = await auditReveals(page);
  console.log(`${stop.id}${stop.kind === 'mid' ? '(mid)' : ''}`.padEnd(16) + `doc=${stop.progress.toFixed(3)} sp=${stop.sp}  ${state}`);
  if (stuck.length) {
// Only the chapter under inspection should be complete; other chapters are
  // legitimately still at --p: 0 because they are off-screen.
    //
    // Nesting depth matters for the prefix test: `.about-section` and
    // `.about-content` both start "about", but an element only "belongs" to the
    // chapter if it is a descendant of the chapter root — checking the string
    // prefix alone let a nested `.about-content` match even when the chapter
    // itself was fine.
    const mine = stuck.filter((s) => {
      const root = stop.sel.slice(1).split('-')[0];
      if (!s.cls.startsWith(root)) return false;
      return stop.inChapter.includes(s.cls);
    });
    if (mine.length) {
      console.log(`  ${mine.length} of THIS chapter's element(s) still mid-reveal:`);
      for (const s of mine.slice(0, 6)) console.log(`    --p=${s.p}  right-inset=${s.right}  ${s.cls}`);
      problems.push(`${stop.id}: ${mine.length} reveal(s) did not complete`);
    } else {
      console.log(`  reveals complete (${stuck.length} off-screen chapter element(s) still pending)`);
    }
  } else {
    console.log('  all reveals complete');
  }
}

if (errors.length) {
  console.log('\n--- console errors ---');
  for (const e of new Set(errors)) console.log(`  ${e}`);
  await writeFile(path.join(OUT, `errors${suffix}.txt`), errors.join('\n'));
  problems.push(`${errors.length} console error(s)`);
} else {
  console.log('\nno console errors');
}

await browser.close();

if (problems.length) {
  console.error(`\nFAIL: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`\nOK: ${STOPS.length} chapter(s) captured to ${OUT}`);