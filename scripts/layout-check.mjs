/**
 * Layout guard: measures the real rendered page at the sizes where this
 * project has repeatedly broken, and fails loudly.
 *
 * jsdom models no layout and no font metrics, so the unit tests cannot see
 * a wrapped nav item, a third button row or a scroll hint below the fold —
 * every one of those shipped at least once. This script closes that gap.
 *
 *   npm run test:layout [-- http://localhost:4401]
 *
 * Expects a served production build. Requires Chrome (CHROME_PATH to
 * override). Exits non-zero on any violation.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4401';
const PORT = 9422;

/* Width × height, not width alone: the hero's fit depends on both, and a
   single height once made every assertion pass by accident. 1366×768 and
   1280×800 are the laptop sizes most visitors actually have. */
const VIEWPORTS = [
  [320, 720], [390, 844], [520, 900],
  /* 610 and 701 close a 380px hole between 520 and 900 that sat exactly on a
     component breakpoint: the stats band overshot its column by 17px there and
     every sampled width said it was fine. 701 rather than a comfortable width
     like 760 on purpose — a grid with a min-content floor always binds at the
     LOWER bound of its mode, so the tightest four-column width is the one
     worth sampling (~60px of slack there against ~110px at 760). */
  [610, 900], [701, 900],
  [900, 900],
  [1181, 900], [1245, 900], [1291, 900],
  [1280, 800], [1366, 768], [1440, 900], [1536, 864], [1920, 1080],
  /* Beyond the 1728px content cap: without it the measure just kept
     growing, which no narrower viewport could ever reveal. */
  [2560, 1440],
];

/* All three locales: Turkish has the widest navigation, so a breakpoint
   validated only in German proves nothing. */
const ROUTES = [
  '/', '/en', '/tr',
  /* One route per narrow-container class (.legal-page, .service-page,
     .blog-page). Measuring only the home page is how a privacy policy
     collapsed to one word per line at 2300px while the guard reported 39
     green combinations. The sibling routes of each class (/legal-notice,
     the other three service pages, the blog articles) and the /en and /tr
     variants share the same CSS, so they are covered by construction —
     add a route here only when a NEW container class appears. */
  '/privacy-policy', '/sorglos-paket', '/blog',
];

/* Deliberately empty. An allowlist here was used once to ship a real,
   visible defect as green — the clipped contact headline at 320 px — so
   anything that lands in `failures` fails the run. */
const KNOWN = [];

const CHROME = process.env.CHROME_PATH ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p));

if (!CHROME) {
  console.error('No Chrome found. Set CHROME_PATH to run the layout guard.');
  process.exit(2);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP ?? '/tmp'}/cdp-layout-check`,
  'about:blank',
], { stdio: 'ignore' });

let socket;
let msgId = 0;
const failures = [];

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const page = (await res.json()).find(t => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        return ws;
      }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not expose its debugging port');
}

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const onMessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.id !== id) return;
      socket.removeEventListener('message', onMessage);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    };
    socket.addEventListener('message', onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

/* Reads the layout as rendered. The side-by-side/stacked distinction is
   derived from the grid itself, never from a copy of the CSS breakpoint —
   a guard that assumes the implementation cannot catch it being wrong.
   Missing selectors throw rather than pass silently. */
const PROBE = `(async () => {
  await document.fonts.ready;

  const need = (sel, min) => {
    const els = [...document.querySelectorAll(sel)];
    if (els.length < min) throw new Error('layout-check: expected >= ' + min + ' of ' + sel + ', found ' + els.length);
    return els;
  };
  const one = sel => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('layout-check: missing ' + sel);
    return el;
  };

  /* Hero-only measurements are skipped where there is no hero — the header
     and the overflow checks still run on every route. */
  const hasHero = !!document.querySelector('.hero-grid');
  const ctas = hasHero ? need('.hero-cta > a', 2) : [];
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  const grid = hasHero ? one('.hero-grid') : null;
  const controls = one('.header-controls').getBoundingClientRect();
  const hintEl = document.querySelector('.hero-bottom');
  const fab = document.querySelector('.wa-fab');
  /* The band's rules may run under the button; its moving text may not.
     Measure the clipping window, not the track — the track is wider than
     the screen by design and slides through it. */
  const bandText = document.querySelector('.hero-band .marquee');

  const sideBySide = hasHero && getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).length > 1;
  /* display:none on the nav does not propagate to its children, so asking a
     link whether it is displayed always says "inline" and the check silently
     asserted nothing below the desktop breakpoint. */
  const navEl = document.querySelector('.desktop-nav');
  const navVisible = !!navEl && getComputedStyle(navEl).display !== 'none';
  if (navVisible) need('.desktop-nav a', 5);

  /* What a visitor actually loses off the right edge.
     Content overflowing its own box is the primary signal, because
     body's overflow-x:hidden clamps every rect to the viewport — an
     element never looks too wide, its text just disappears. That is
     exactly how the clipped contact headline hid from earlier attempts.
     Elements that clip or scroll on purpose (the marquee window, the
     hero) are excluded by their own overflow, not by their ancestry:
     excluding whole subtrees blinded the guard to everything inside them.
     Rect overflow is still measured for elements no ancestor clips —
     fixed-position chrome like the floating button. */
  const measureOverflow = () => {
    const edge = document.documentElement.clientWidth;
    let worst = 0;
    let culprit = '';

    const note = (px, el, why) => {
      if (px > worst) {
        worst = Math.round(px);
        culprit = el.tagName.toLowerCase() +
          (el.className ? '.' + String(el.className).split(' ')[0] : '') + ' (' + why + ')';
      }
    };

    const clipsItself = style =>
      ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) ||
      ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);

    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[inert]')) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;

      const rect = el.getBoundingClientRect();
      /* Skips zero-size boxes and the 1px screen-reader-only pattern,
         whose text overflows its box by design. */
      if (rect.width <= 1 || rect.height <= 1) continue;

      /* Only elements holding their own text: a box whose *children*
         overhang is usually a deliberate bleed (the device line-up, the
         collapsing button label), while a box whose own words do not fit
         is always lost copy. */
      const holdsText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (holdsText && !clipsItself(style) && el.scrollWidth > el.clientWidth + 1) {
        note(el.scrollWidth - el.clientWidth, el, 'text does not fit its box');
      }

      let clippedByAncestor = false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        if (clipsItself(getComputedStyle(a))) { clippedByAncestor = true; break; }
      }
      if (!clippedByAncestor && rect.right > edge + 0.5) {
        note(rect.right - edge, el, 'sticks out');
      }
    }
    return { px: worst, culprit };
  };

  const overlap = (a, b) => a && b
    ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 0
    : false;

  return {
    hasHero,
    sideBySide,
    ctaRows: new Set(ctas.map(e => Math.round(e.getBoundingClientRect().top))).size,
    navRight: navVisible ? Math.round(Math.max(...navLinks.map(a => a.getBoundingClientRect().right))) : null,
    controlsLeft: Math.round(controls.left),
    themeOverflow: Math.round(one('.theme-btn').getBoundingClientRect().right - document.documentElement.clientWidth),
    hintShown: !!hintEl && getComputedStyle(hintEl).display !== 'none',
    hintOverflow: hintEl ? Math.round(hintEl.getBoundingClientRect().bottom - window.innerHeight) : null,
    fabOverBand: overlap(fab?.getBoundingClientRect(), bandText?.getBoundingClientRect()),
    pageOverflow: measureOverflow(),
    /* The stats band is full-bleed by design, so the 1440px content check
       cannot see it — and it was the one section whose numbers still sat at
       the window edge while every heading around it had moved inwards.
       Measured against a real neighbour, not against a copy of the CSS. */
    statsAlign: (() => {
      const row = document.querySelector('.stats-row');
      /* No band on this route means nothing to align — but a band without its
         neighbour means the check would switch itself off silently, so that
         case throws like every other missing selector in this file. */
      if (!row) return null;
      const skills = one('#skills');
      const cs = getComputedStyle(skills);
      const sr = skills.getBoundingClientRect();
      const firstValue = row.querySelector('.stat-value');
      const items = [...row.querySelectorAll('.stat-item')];
      if (!firstValue || !items.length) return null;
      return {
        left: Math.round(firstValue.getBoundingClientRect().left - (sr.left + parseFloat(cs.paddingLeft))),
        right: Math.round((sr.right - parseFloat(cs.paddingRight)) - items[items.length - 1].getBoundingClientRect().right),
      };
    })(),
    widestSection: (() => {
      /* The content box of a padded section IS the measure. Reported with
         its owner so a regression names the section, not just a number. */
      let px = 0, culprit = null, narrowest = Infinity, narrowestWho = null, narrowestPx = null;
      for (const el of document.querySelectorAll('.section-padding')) {
        const cs = getComputedStyle(el);
        const inner = el.getBoundingClientRect().width
          - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const who = el.id || el.className.split(' ')[0];
        if (inner > px) { px = Math.round(inner); culprit = who; }
        /* A collapsed column is the other half of the same failure: padding
           that grows with the viewport can outgrow an inner max-width and
           squeeze the text to nothing. Measured as a SHARE of the element's
           own box, not as an absolute width — at a 320px viewport a 269px
           column is correct, at 2560px a 0px column inside an 1120px box is
           the defect. Only measured where there IS text. */
        const box = el.getBoundingClientRect().width;
        const share = box > 0 ? inner / box : 1;
        if (el.textContent.trim() && share < narrowest) { narrowest = share; narrowestWho = who; narrowestPx = Math.round(inner); }
      }
      return { px, culprit, narrowestShare: narrowest === Infinity ? null : +narrowest.toFixed(2), narrowestPx, narrowestWho };
    })(),
  };
})()`;

/* Opens the burger menu, measures its links, closes it again. Returns null
   where the burger is not offered (desktop widths). */
const MENU_PROBE = `(async () => {
  const burger = document.querySelector('.burger');
  const overlay = document.querySelector('.nav-overlay');
  if (!burger || !overlay || getComputedStyle(burger).display === 'none') return null;

  burger.click();
  await new Promise(r => setTimeout(r, 450));

  const edge = document.documentElement.clientWidth;
  const clipped = [...overlay.querySelectorAll('a')]
    .filter(a => a.getBoundingClientRect().right > edge + 0.5 || a.scrollWidth > a.clientWidth + 1)
    .map(a => a.textContent.trim().slice(0, 20));
  const sideways = overlay.scrollWidth - overlay.clientWidth;

  burger.click();
  await new Promise(r => setTimeout(r, 350));
  return { clipped, sideways };
})()`;

async function run() {
  await send('Page.enable');

  for (const route of ROUTES) {
    for (const [width, height] of VIEWPORTS) {
      /* mobile:false on purpose. Chrome's mobile emulation widens the
         layout viewport to the document's scroll width, so a fixed header
         then measures wider than the screen and masks which element
         actually caused the overflow. */
      await send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 1, mobile: false,
      });
      await send('Page.navigate', { url: `${BASE}${route}?layout=${Date.now()}` });
      await sleep(2800);

      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        returnByValue: true, awaitPromise: true, expression: PROBE,
      });
      /* The burger menu covers the screen when open and is invisible to the
         closed-state pass — its links were clipped at 320/360 for a while
         with nothing to catch it. */
      const menu = await send('Runtime.evaluate', {
        returnByValue: true, awaitPromise: true, expression: MENU_PROBE,
      });
      if (exceptionDetails) {
        failures.push(`${route} ${width}×${height}: probe failed — ${exceptionDetails.text ?? result?.description}`);
        continue;
      }

      const m = result.value;
      const at = `${route} ${width}×${height}`;

      if (m.pageOverflow.px > 0) failures.push(`${at}: ${m.pageOverflow.culprit} sticks out ${m.pageOverflow.px}px past the right edge`);
      if (m.themeOverflow > 0) failures.push(`${at}: theme toggle sticks out ${m.themeOverflow}px`);
      if (m.widestSection.px > 1440)
        failures.push(`${at}: ${m.widestSection.culprit} content is ${m.widestSection.px}px wide (max 1440) — the page lost its margin`);
      /* Both conditions, not either: a correctly capped section pins its
         content at 1440px, so its share of the box keeps falling as the
         viewport grows and would drop under 25% past ~5760px on perfectly
         good CSS. The absolute floor is what makes this about a collapsed
         column rather than about a wide screen. */
      if (m.widestSection.narrowestShare !== null
          && m.widestSection.narrowestShare < 0.25 && m.widestSection.narrowestPx < 400)
        failures.push(`${at}: ${m.widestSection.narrowestWho} content is only ${m.widestSection.narrowestPx}px, ${Math.round(m.widestSection.narrowestShare * 100)}% of its own box — the padding ate it`);
      if (m.statsAlign && Math.abs(m.statsAlign.left) > 2)
        failures.push(`${at}: stats band starts ${m.statsAlign.left}px off the content column`);
      if (m.statsAlign && Math.abs(m.statsAlign.right) > 2)
        failures.push(`${at}: stats band ends ${m.statsAlign.right}px off the content column`);
      if (m.navRight !== null && m.navRight > m.controlsLeft) {
        failures.push(`${at}: nav overlaps the controls by ${m.navRight - m.controlsLeft}px`);
      }
      if (m.hasHero && m.fabOverBand) failures.push(`${at}: floating button covers the marquee band`);
      if (m.sideBySide && m.ctaRows > 2) {
        failures.push(`${at}: hero has ${m.ctaRows} button rows (max 2)`);
      }
      /* A rendered hint must be reachable without scrolling — in every
         layout. Gating this on side-by-side once hid the exact defect the
         check exists for. */
      if (m.hintShown && m.hintOverflow > 0) {
        failures.push(`${at}: scroll hint is ${m.hintOverflow}px below the fold`);
      }

      const mm = menu.result.value;
      if (mm) {
        if (mm.clipped.length) {
          failures.push(`${at}: open menu clips ${mm.clipped.join(', ')}`);
        }
        if (mm.sideways > 0) {
          failures.push(`${at}: open menu scrolls sideways by ${mm.sideways}px`);
        }
      }

      console.log(
        `${route.padEnd(4)} ${String(width).padStart(4)}×${String(height).padEnd(4)}` +
        `  ${m.sideBySide ? 'side' : 'stack'}  rows=${m.ctaRows}` +
        `  hint=${!m.hintShown ? 'off' : m.hintOverflow > 0 ? `+${m.hintOverflow}` : 'ok'}` +
        `  fab=${m.fabOverBand ? 'OVERLAP' : 'ok'}` +
        `  menu=${!mm ? '-' : mm.clipped.length || mm.sideways > 0 ? 'BROKEN' : 'ok'}`,
      );
    }
  }
}

try {
  socket = await connect();
  await run();
} catch (error) {
  console.error(`Layout guard could not run: ${error.message}`);
  process.exitCode = 2;
} finally {
  socket?.close();
  chrome.kill();
}

if (process.exitCode !== 2) {
  const known = failures.filter(f => KNOWN.some(k => f.includes(k.match)));
  const fresh = failures.filter(f => !known.includes(f));

  if (known.length) {
    console.log(`\n${known.length} known, still-open issue(s):`);
    for (const f of known) console.log(`  ~ ${f}`);
    for (const k of KNOWN) console.log(`    ${k.why}`);
  }

  if (fresh.length) {
    console.error(`\n${fresh.length} NEW layout violation(s):`);
    for (const f of fresh) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log('\nNo new layout violations.');
  }
}
