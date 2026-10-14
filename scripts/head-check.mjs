/**
 * Head guard: reads every prerendered page and fails when what Google and link
 * previews show names the owner, or when the share image the pages point at is
 * broken.
 *
 * Decision of 2026-10-14: the business is presented as "Softlyx"; the owner's
 * personal name stays out of titles, meta tags and structured data. Only the
 * legal notice and the privacy policy name him in their text, as the law
 * requires — and the visible page, which this guard does not read.
 *
 * Half of the head lives in src/index.html and is never touched by SeoService
 * (meta author, og:image:alt), so the unit tests cannot see it. Hence a script
 * over the build output, in the same spirit as contrast-check.mjs. The name rule
 * itself is src/testing/owner-name.ts, shared with the specs — Node 22 strips its
 * type annotations on import, so there is one rule, not two copies.
 *
 *   npm run test:head        (runs after every `npm run build`, i.e. in the deploy)
 *   node --test scripts/head-check.test.mjs   (the page check against fixtures)
 *
 * Silence is not a pass: a dist folder with too few pages is reported, never
 * treated as clean.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { namesOwner } from '../src/testing/owner-name.ts';

const SCRIPT_OR_STYLE = /<(script|style)[^>]*>[^]*?<\/\1>/g;
const JSON_LD = /<script[^>]+application\/ld\+json[^>]*>([^]*?)<\/script>/g;
const TAG = /<(meta|link)\b[^>]*>/gi;
const ATTRIBUTE = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** Attributes of a tag as a map, whatever their order or quoting. */
const attributesOf = (tag) => {
  const map = {};
  for (const m of tag.matchAll(ATTRIBUTE)) map[m[1].toLowerCase()] = m[2] ?? m[3];
  return map;
};

/** First meta/link in the head whose `key` attribute equals `value`; returns its `read` attribute. */
const headValue = (head, key, value, read) => {
  for (const m of head.matchAll(TAG)) {
    const attrs = attributesOf(m[0]);
    if (attrs[key] === value) return attrs[read];
  }
  return undefined;
};

const absolute = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * Checks one prerendered page. Returns the problems found and the path of the
 * og:image it points at (null if there is no usable one), so the caller can check
 * that the file was shipped.
 */
export function checkPage(page, html) {
  const fails = [];
  const end = html.indexOf('</head>');
  if (end < 0) return { fails: [page + ': no </head>'], image: null };
  const head = html.slice(0, end).replace(SCRIPT_OR_STYLE, '');

  for (const piece of head.match(/<[^>]+>|[^<>]+/g) ?? []) {
    if (namesOwner(piece)) fails.push(page + ': the <head> names the owner — ' + piece.trim().slice(0, 100));
  }

  /* Parsed, not read as text: a hand-written ü escape would pass a raw
     match, and invalid JSON-LD is worth a failure of its own. */
  for (const m of html.matchAll(JSON_LD)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      fails.push(page + ': the structured data is not valid JSON');
      continue;
    }
    if (namesOwner(JSON.stringify(data))) fails.push(page + ': the structured data names the owner');
  }

  const image = headValue(head, 'property', 'og:image', 'content');
  if (!image) return { fails: [...fails, page + ': no og:image'], image: null };
  const imageUrl = absolute(image);
  if (!imageUrl) return { fails: [...fails, page + ': og:image is not an absolute URL: ' + image], image: null };

  /* The right path on the wrong host (localhost, a staging domain) would pass a
     path-only check and break every preview. The page's canonical is the origin
     it claims, and it is already in the HTML. */
  const canonical = headValue(head, 'rel', 'canonical', 'href');
  const canonicalUrl = canonical ? absolute(canonical) : null;
  if (!canonicalUrl) fails.push(page + ': no absolute canonical link to compare the og:image host with');
  else if (canonicalUrl.origin !== imageUrl.origin) {
    fails.push(page + ': og:image is on ' + imageUrl.origin + ', the page on ' + canonicalUrl.origin);
  }
  return { fails, image: imageUrl.pathname };
}

/* Only index.html: every served route is one. index.csr.html is never served
   (.htaccess sends errors to /404/index.html) and the Search Console token file
   carries no head worth checking — both skipped on purpose. */
const pages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name === 'index.html' ? [path] : [];
  });

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dist = join(root, 'dist', 'my-website-v2', 'browser');
  if (!existsSync(dist)) {
    console.error('No build output at ' + dist + ' — run `ng build` first.');
    process.exit(1);
  }

  const fail = [];
  const found = pages(dist);
  /* 19 prerendered routes on 2026-10-14. Far fewer means the guard looks in the
     wrong place or the build is broken — either way it measured nothing. */
  if (found.length < 10) {
    fail.push('only ' + found.length + ' prerendered page(s) under ' + dist + ' — the check measured almost nothing');
  }

  const shipped = new Set();
  for (const file of found) {
    const { fails, image } = checkPage(file.slice(dist.length).replaceAll('\\', '/'), readFileSync(file, 'utf8'));
    fail.push(...fails);
    if (image) shipped.add(image);
  }

  /* A renamed or deleted card would leave every preview on a 404. */
  for (const path of shipped) {
    if (!existsSync(join(dist, path))) fail.push('og:image ' + path + ' is not in the build output');
  }

  if (fail.length) {
    console.error('\n' + fail.length + ' head problem(s):');
    for (const f of fail) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('ok   ' + found.length + ' pages: no owner name in <head> or structured data; og:image ' + [...shipped].join(', ') + ' shipped');
}

/* Run only as the entry script. Imported from the fixtures, from `node -e` or a REPL,
   argv[1] is another file or unset — pathToFileURL(undefined) used to throw there.
   Real paths, not URL strings: started through a symlink or junction, the two spellings
   differ, and a false "not the entry" would let the build pass without checking. */
const isEntry = () => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
};
if (isEntry()) main();
