/**
 * Button style guard: proves that a refactor of the shared button CSS changed
 * nothing a visitor can see.
 *
 * Unlike the other guards in here this one is not an invariant check — there is
 * no "correct" padding it could assert. It compares TWO BUILDS: sweep the one
 * you started from, sweep the one you produced, diff the numbers. Anything that
 * moved shows up with route, theme, state and property.
 *
 *   # build the baseline somewhere else, e.g. from a worktree on main
 *   node scripts/button-style-check.mjs sweep <distBrowserDir> before.json
 *   node scripts/button-style-check.mjs sweep dist/my-website-v2/browser after.json
 *   node scripts/button-style-check.mjs diff before.json after.json
 *
 * Requires Chrome (CHROME_PATH to override). Serves the build itself, so no
 * separate preview server is needed. Exits non-zero on any difference.
 *
 * Why it exists: the buttons were consolidated into one global base in
 * styles.scss, and reading the diff was NOT enough to see what that changed.
 * Two things hid from plain inspection and both are covered here:
 *
 *   1. `:hover`. A component rule only wins the properties it DECLARES. The
 *      wizard's small button declared no hover `transform`, so while it was
 *      also called `.btn-ghost` the global base handed it a 2px jump its own
 *      `transition` does not even list. A sweep of resting state alone reports
 *      "identical" and is wrong. Hover is forced through CDP, not inferred
 *      from the stylesheets. (The button is `.btn-quiet` now — the rename is
 *      what removed the trap; this guard is what proved the rename invisible.)
 *   2. The wizard's success screen. It only exists after a successful submit,
 *      so no prerendered route contains it — and it is exactly where the dead
 *      CSS was deleted. A stand-in is injected into the real component subtree
 *      carrying its real `_ngcontent` attribute, which is what decides whether
 *      component rules apply at all. If that injection never succeeds on any
 *      route, the run FAILS rather than quietly skipping it.
 *
 * Theme switching waits: the buttons carry `transition: background .15s` and
 * friends, so measuring straight after toggling `body.light` reads the running
 * animation. That produced a full set of phantom differences once.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage:');
  console.error('  node scripts/button-style-check.mjs sweep <distBrowserDir> <out.json>');
  console.error('  node scripts/button-style-check.mjs diff <before.json> <after.json>');
  process.exit(2);
}

/* Every property these rules are made of. `display` and `align-items` earn their
   place even though they sound harmless: both changed silently during the
   consolidation, and `display` decides how the box lays out at all. The list
   grew again when `.privacy-note` and `.success-msg` moved: a property that is
   moved but not measured makes this guard report "no differences" about exactly
   the value that was lost — `line-height`, `row-gap` and `text-underline-offset`
   were in that position once.
   Every name here must be one CDP actually returns. `white-space` was in this
   list and never came back — the reader below skips what it cannot find, so a
   third of a property list could be dead and the run would still say "no
   differences". The tripwire after the sweep now refuses to write a result when
   a listed property appeared on no node at all.
   This is computed style only — not a pixel comparison, and a difference
   invisible here could still exist in a screenshot. */
const PROPS = [
  'display', 'flex-direction', 'align-items', 'justify-content', 'row-gap', 'column-gap',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'background-color', 'background-image', 'color', 'font-family', 'font-weight',
  'font-size', 'line-height', 'letter-spacing', 'text-transform',
  'text-decoration-line', 'text-underline-offset',
  'border-top-width', 'border-top-style', 'border-top-color',
  'border-right-width', 'border-right-style', 'border-right-color',
  'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
  'border-left-width', 'border-left-style', 'border-left-color',
  'transition-property', 'transition-duration', 'transition-timing-function',
  'transition-delay',
  'transform', 'cursor', 'opacity', 'overflow-x', 'position',
];

/* `.error-msg` and `.success-msg` are in here even though neither is a button:
   they share the consolidation this guard was built for, and both live in the
   two form components whose rules are now global. `.btn-quiet` is the wizard's
   own small ghost, deliberately named apart from `.btn-ghost` so the global
   base cannot reach it. */
const SELECTOR = '.btn-primary, .btn-ghost, .btn-quiet, .btn-compact, '
  + '.btn-submit, .btn-next, .btn-whatsapp, '
  /* The children matter as much as the boxes: .success-icon, the heading and
     the paragraph all moved into the shared rule, so leaving them out would
     have meant proving nothing about half of what changed. */
  + '.error-msg, .error-msg a, .success-msg, '
  + '.success-msg .success-icon, .success-msg h3, .success-msg p, '
  /* .privacy-note was a byte-for-byte copy in both form components and is now
     one global rule; .btn-back shares a rule with .btn-quiet inside the wizard. */
  + '.privacy-note, .privacy-note a, .btn-back';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* The class list is part of the identity of a measured element, but
   `btn-compact` is a class this very refactor adds — keeping it in the key
   would make every one of those buttons look like a removed element plus an
   added one instead of the same button before and after. */
const NORMALISE = cls => cls.replace(/ ?btn-compact/, '').trim();

async function sweep(dist, out) {
  const routesFile = path.join(dist, '..', 'prerendered-routes.json');
  if (!existsSync(routesFile)) {
    console.error(`No prerendered-routes.json next to ${dist} — is this a production build?`);
    return 2;
  }

  const server = createServer(async (req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    let f = path.join(dist, p);
    try {
      if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
      else if (!existsSync(f)) f = path.join(dist, p, 'index.html');
      const buf = await readFile(f);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] ?? 'application/octet-stream' });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  const port = await new Promise(r => server.listen(0, () => r(server.address().port)));

  const chromePath = process.env.CHROME_PATH ?? [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find(p => existsSync(p));
  if (!chromePath) {
    console.error('No Chrome found. Set CHROME_PATH to run the button guard.');
    server.close();
    return 2;
  }

  /* The stand-in below picks its class by asking the stylesheet what it
     defines. That has one blind spot worth closing here, in the build, before
     Chrome even starts: if a template uses a class NO rule defines, the
     stand-in quietly falls back to the other name — on both sides of a
     comparison — and the diff reports "no change" for a button that lost its
     entire appearance. So: a class the markup uses must be a class the CSS
     defines. */
  const buildText = (function collect(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return collect(full);
      return /[.](?:js|html|css)$/.test(entry.name) ? [readFileSync(full, 'utf8')] : [];
    });
  })(dist).join('\n');

  let markupMentions = 0;
  for (const cls of ['btn-quiet', 'btn-ghost']) {
    /* Either the whole class attribute or the first of several. Angular emits
       every static class as its own string, so this sees them individually. */
    const usedInMarkup = new RegExp('"' + cls + '[ "]').test(buildText);
    /* Same boundary as defines() below. A narrower character class rejected
       rules that exist only as `.btn-quiet>span`, `.btn-quiet.foo` or inside
       `:is(…)` — refusing a healthy build is as bad as passing a broken one. */
    const definedInCss = new RegExp('[.]' + cls + '(?![\\w-])').test(buildText);
    if (usedInMarkup) markupMentions++;
    if (usedInMarkup && !definedInCss) {
      console.error(`FAIL: the markup uses "${cls}" but no rule defines it — the stand-in would measure the wrong button.`);
      server.close();
      return 1;
    }
  }
  /* A check that can stop matching is a check that stops guarding — so this
     one fails when both names are gone from the markup.

     Be precise about what it does NOT cover, because the obvious reading is
     wrong: renaming only the WIZARD's button to a third name leaves this quiet,
     since `.btn-ghost` is still in the markup for hero and not-found. The
     stand-in would then fall back to the global ghost and the run would report
     "no differences" about a button it never looked at.
     That case is caught elsewhere, and deliberately so: the assertion in
     contact-wizard.spec.ts pins `.success-msg .btn-quiet` and runs inside
     `guardian verify`, which this script does not. Two guards, one hole each,
     and neither pretends to cover the other's. */
  if (!markupMentions) {
    console.error('FAIL: neither "btn-quiet" nor "btn-ghost" appears in the markup — the stand-in models a button that no longer exists.');
    server.close();
    return 1;
  }

  const cdpPort = 9433;
  const chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${process.env.TEMP ?? '/tmp'}/cdp-button-style-check`,
    'about:blank',
  ], { stdio: 'ignore' });

  let socket;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const page = (await r.json()).find(t => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
        socket = ws;
        break;
      }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  if (!socket) {
    console.error('Chrome did not expose its debugging port');
    chrome.kill();
    server.close();
    return 2;
  }

  let msgId = 0;
  const send = (method, params = {}) => {
    const id = ++msgId;
    return new Promise((resolve, reject) => {
      const on = e => {
        const m = JSON.parse(e.data);
        if (m.id !== id) return;
        socket.removeEventListener('message', on);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      };
      socket.addEventListener('message', on);
      socket.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  /* The success screen needs a real fetch to appear, which a guard must not
     make. The stand-in carries the component's own encapsulation attribute —
     without it no component rule would match and the measurement would be
     meaningless. */
  const INJECT = `(() => {
    const wiz = document.querySelector('app-contact-wizard');
    if (!wiz) return 'no-wizard';
    if (wiz.querySelector('.success-msg')) return 'already-there';
    const inner = wiz.querySelector('*');
    if (!inner) return 'empty-wizard';
    const attr = [...inner.attributes].map(x => x.name).find(n => n.startsWith('_ngcontent'));
    if (!attr) return 'no-encapsulation-attribute';
    const make = (tag, cls, id) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (id) el.id = id;
      el.setAttribute(attr, '');
      return el;
    };

    /* Which class the success button carries is read from the build, not
       assumed: it was renamed from .btn-ghost to .btn-quiet precisely so the
       global ghost could not reach it, and a stand-in hard-coded to either
       name measures the wrong thing on the other side of that rename. The id
       stays stable so both sides line up in the diff.
       Grouping rules (@media) expose no selectorText, so their children are
       walked too, and the match is on a token boundary — .btn-quiet-x is not
       .btn-quiet. If NEITHER name is defined the run fails rather than
       guessing, because then the stand-in would measure an unstyled element
       and report it as "no change". */
    const defines = cls => {
      const hit = list => [...list].some(rule => {
        if (rule.selectorText) {
          return new RegExp('\\\\' + cls + '(?![\\\\w-])').test(rule.selectorText);
        }
        return rule.cssRules ? hit(rule.cssRules) : false;
      });
      return [...document.styleSheets].some(sheet => {
        try { return hit(sheet.cssRules); } catch { return false; }
      });
    };
    const quiet = defines('.btn-quiet');
    if (!quiet && !defines('.btn-ghost')) return 'no-success-button-class-defined';

    /* The success screen replaces the wizard block rather than sitting inside
       it, so this one really does hang off the component root — that matches
       the template. */
    const box = make('div', 'success-msg');
    const icon = make('span', 'success-icon');
    icon.textContent = 'OK';
    const h3 = make('h3');
    h3.textContent = 'SYNTHETIC SUCCESS HEADING';
    const para = make('p');
    para.textContent = 'SYNTHETIC SUCCESS PARAGRAPH';
    const btn = make('button', quiet ? 'btn-quiet' : 'btn-ghost', 'synthetic-success-button');
    btn.textContent = 'SYNTHETIC SUCCESS BUTTON';
    box.append(icon, h3, para, btn);
    wiz.append(box);

    /* Everything below is behind a wizard step, so a freshly loaded page shows
       none of it. The parent chain is rebuilt rather than hung off the
       component root: .error-msg is a flex child of the form (same display and
       direction as .wizard), and the two buttons are flex children of
       .wizard-nav. Parentage decides display through blockification, which is
       the property this guard cares about most. .btn-back rides along for the
       same reason: it lives behind step 2 and appears on no route either. */
    const wizard = make('div', 'wizard');
    const err = make('p', 'error-msg', 'synthetic-error-msg');
    err.textContent = 'SYNTHETIC ERROR LINE ';
    const errLink = make('a', null, 'synthetic-error-link');
    errLink.textContent = 'MAILTO FALLBACK';
    errLink.href = '#';
    err.append(errLink);
    const nav = make('div', 'wizard-nav');
    for (const cls of ['btn-submit', 'btn-next', 'btn-back']) {
      const b = make('button', cls, 'synthetic-' + cls);
      b.textContent = 'SYNTHETIC ' + cls.toUpperCase();
      nav.append(b);
    }
    /* The shared rule carries a :disabled block (dimmed, not-allowed) that no
       other stand-in can show: CDP cannot force that state, and the real submit
       button is enabled at rest. So one stand-in is genuinely disabled. */
    const off = make('button', 'btn-submit', 'synthetic-btn-submit-disabled');
    off.disabled = true;
    off.textContent = 'SYNTHETIC DISABLED SUBMIT';
    nav.append(off);
    wizard.append(err, nav);
    wiz.append(wizard);

    return 'ok';
  })()`;

  const routes = Object.keys(JSON.parse(await readFile(routesFile, 'utf8')).routes);
  const result = {};
  let injected = 0;

  for (const route of routes) {
    await send('Page.navigate', { url: `http://127.0.0.1:${port}${route}` });
    await sleep(2000);
    await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });

    const inj = await send('Runtime.evaluate', { expression: INJECT, returnByValue: true });
    if (inj.result.value === 'ok') injected++;

    for (const theme of ['dark', 'light']) {
      await send('Runtime.evaluate',
        { expression: `document.body.classList.toggle('light', ${theme === 'light'})` });
      /* Long enough for every transition on a button to have finished. */
      await sleep(1400);

      const doc = await send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await send('DOM.querySelectorAll',
        { nodeId: doc.root.nodeId, selector: SELECTOR });

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        const desc = await send('DOM.describeNode', { nodeId });
        const attrs = desc.node.attributes ?? [];
        const ci = attrs.indexOf('class');
        const idi = attrs.indexOf('id');
        const name = idi >= 0 ? attrs[idi + 1] : NORMALISE(ci >= 0 ? attrs[ci + 1] : '');

        for (const hover of [false, true]) {
          await send('CSS.forcePseudoState',
            { nodeId, forcedPseudoClasses: hover ? ['hover'] : [] });
          if (hover) await sleep(650);
          const { computedStyle } = await send('CSS.getComputedStyleForNode', { nodeId });
          const style = {};
          for (const p of PROPS) {
            const entry = computedStyle.find(c => c.name === p);
            if (entry) style[p] = entry.value;
          }
          result[`${route}|${theme}|${hover ? 'hover' : 'rest'}|${i}|${desc.node.nodeName}|${name}`] = style;
        }
        await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      }
    }
  }

  chrome.kill();
  server.close();

  const seen = new Set();
  for (const row of Object.values(result)) for (const p of Object.keys(row)) seen.add(p);
  const never = PROPS.filter((p) => !seen.has(p));
  if (never.length) {
    console.error('FAIL: these properties were never returned for any node: ' + never.join(', '));
    console.error('A listed property the browser does not report is a silent hole — fix the name or drop it.');
    return 1;
  }

  if (!injected) {
    console.error('FAIL: the success-screen stand-in was never injected on any route.');
    console.error('The wizard markup changed, and the one state the dead CSS lived in is unmeasured.');
    return 1;
  }

  await writeFile(out, JSON.stringify(result, null, 1));
  console.log(`Swept ${routes.length} routes, ${Object.keys(result).length} measurements`);
  console.log(`Success-screen stand-in injected on ${injected} route(s)`);
  console.log(`Written to ${out}`);
  return 0;
}

async function diff(beforeFile, afterFile) {
  const before = JSON.parse(await readFile(beforeFile, 'utf8'));
  const after = JSON.parse(await readFile(afterFile, 'utf8'));

  const onlyBefore = Object.keys(before).filter(k => !(k in after));
  const onlyAfter = Object.keys(after).filter(k => !(k in before));
  const diffs = [];

  for (const key of Object.keys(before)) {
    if (!(key in after)) continue;
    for (const p of Object.keys(before[key])) {
      if (before[key][p] !== after[key][p]) {
        diffs.push(`${key}\n    ${p}: ${before[key][p]}  ->  ${after[key][p]}`);
      }
    }
  }

  console.log(`Compared ${Object.keys(before).length} measurements`);
  if (!onlyBefore.length && !onlyAfter.length && !diffs.length) {
    console.log('No button style differences.');
    return 0;
  }

  if (onlyBefore.length) {
    console.log(`\nOnly in ${beforeFile} — ${onlyBefore.length}:`);
    for (const k of onlyBefore.slice(0, 10)) console.log('  ' + k);
    if (onlyBefore.length > 10) console.log(`  ... and ${onlyBefore.length - 10} more`);
  }
  if (onlyAfter.length) {
    console.log(`\nOnly in ${afterFile} — ${onlyAfter.length}:`);
    for (const k of onlyAfter.slice(0, 10)) console.log('  ' + k);
    if (onlyAfter.length > 10) console.log(`  ... and ${onlyAfter.length - 10} more`);
  }
  if (diffs.length) {
    console.log(`\nChanged properties — ${diffs.length}:`);
    for (const d of diffs.slice(0, 25)) console.log('  ' + d);
    if (diffs.length > 25) console.log(`  ... and ${diffs.length - 25} more`);
  }
  return 1;
}

/* Dispatch last: the helpers above are `const`, so calling into them from the
   top of the file would hit the temporal dead zone. */
const [mode, fileA, fileB] = process.argv.slice(2);

if (mode === 'sweep') {
  if (!fileA || !fileB) usage();
  process.exit(await sweep(fileA, fileB));
} else if (mode === 'diff') {
  if (!fileA || !fileB) usage();
  process.exit(await diff(fileA, fileB));
} else {
  usage();
}
