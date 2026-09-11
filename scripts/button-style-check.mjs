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
 *   1. `:hover`. A component rule only wins the properties it DECLARES; the
 *      wizard's ghost button declared no hover `transform`, so the global base
 *      handed it a 2px jump its own `transition` does not even list. A sweep of
 *      resting state alone reports "identical" and is wrong. Hover is forced
 *      through CDP, not inferred from the stylesheets.
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
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage:');
  console.error('  node scripts/button-style-check.mjs sweep <distBrowserDir> <out.json>');
  console.error('  node scripts/button-style-check.mjs diff <before.json> <after.json>');
  process.exit(2);
}

/* Every property a button's look is made of. `display` and `align-items` earn
   their place even though they sound harmless: both changed silently during the
   consolidation, and `display` is the one that decides how the box lays out at
   all. This is computed style only — it is not a pixel comparison, and a
   difference invisible here could still exist in a screenshot. */
const PROPS = [
  'display', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'background-color', 'background-image', 'color', 'font-family', 'font-weight',
  'font-size', 'letter-spacing', 'text-transform', 'text-decoration-line',
  'border-top-width', 'border-top-style', 'border-top-color', 'border-left-width',
  'transition-property', 'transition-duration', 'transition-timing-function',
  'transform', 'align-items', 'justify-content', 'cursor', 'opacity',
  'margin-top', 'white-space', 'overflow-x', 'position',
];

const SELECTOR = '.btn-primary, .btn-ghost, .btn-compact, .btn-submit, .btn-next, .btn-whatsapp';

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
    const box = document.createElement('div');
    box.className = 'success-msg';
    box.setAttribute(attr, '');
    const icon = document.createElement('span');
    icon.className = 'success-icon';
    icon.setAttribute(attr, '');
    icon.textContent = 'OK';
    const btn = document.createElement('button');
    btn.className = 'btn-ghost';
    btn.id = 'synthetic-success-ghost';
    btn.setAttribute(attr, '');
    btn.textContent = 'SYNTHETIC SUCCESS GHOST';
    box.append(icon, btn);
    wiz.append(box);
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
