// Generates dist/my-website-v2/browser/sitemap.xml with hreflang alternates
// for all locales, from the same route map the app uses. Runs after `ng build`
// (wired into the npm "build" script).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(root, 'dist', 'my-website-v2', 'browser');

const routes = JSON.parse(readFileSync(join(root, 'src/app/i18n/routes.json'), 'utf8'));
const registry = JSON.parse(readFileSync(join(root, 'src/app/blog/blog-registry.json'), 'utf8'));

/* The home page's <head> lists the Turkish site (own domain) as hreflang="tr"
   once SITE_CONFIG.turkishSiteUrl is set — the sitemap has to say the same,
   or the two hreflang sources contradict each other. Read from the same
   constant the app uses; a missing match is a broken config, not a default. */
const siteConfig = readFileSync(join(root, 'src/app/config/site.config.ts'), 'utf8');

/* Read from the app's own constant instead of repeating it. A second copy would make
   the check below compare this file against itself: every URL would be wrong, every
   URL would still be shaped, and nothing would notice. */
const baseMatch = siteConfig.match(/^\s*baseUrl:\s*'([^']*)'/m);
if (!baseMatch) {
  console.error('site.config.ts has no baseUrl entry — cannot build absolute URLs.');
  process.exit(1);
}
const BASE = baseMatch[1];

/* Every absolute URL this file emits must have the shape absoluteUrl() produces in
   src/app/i18n/route-map.ts: the base URL, then non-empty segments, always closed by
   exactly one slash. The rule is written down twice — this script is plain Node and
   cannot import the TypeScript helper — so each side pins it for itself: the app side
   in seo.service.spec.ts, this side in the check below, which runs on every deploy
   (.github/workflows/deploy.yml calls "npm run build"). A sitemap that contradicts
   the pages' own canonical links must not reach the server. There is no test that
   runs this generator.

   Only the path is matched: the host is already guaranteed by the startsWith(BASE)
   filter below, so spelling out scheme and host here would add nothing but a way for
   a port or a staging base to fail as a "malformed URL" that blames the slug.
   Segments are restricted to what the slug tables use, plus percent-encoding for
   non-ASCII slugs — which is why uppercase is allowed: percent-encoded octets are
   written in uppercase hex, and a region-suffixed locale segment like "en-GB" would
   otherwise fail the build for nothing. That also rules out the characters which would have to be
   XML-escaped below: "&" in a slug would otherwise produce a perfectly shaped URL
   inside an invalid sitemap. A slug outside this set fails the build on purpose;
   widen the set here and add escaping to the output in the same change. */
const PATH_SHAPE = /^\/(?:[a-zA-Z0-9._~%-]+\/)*$/;

const turkishMatch = siteConfig.match(/turkishSiteUrl:\s*'([^']*)'/);
if (!turkishMatch) {
  console.error('site.config.ts has no turkishSiteUrl entry — sitemap and <head> would diverge.');
  process.exit(1);
}
const HOME_EXTERNAL = turkishMatch[1] ? [{ hreflang: 'tr', href: turkishMatch[1] }] : [];

const today = new Date().toISOString().slice(0, 10);

/* Trailing slash on every path but the root — the same rule as absoluteUrl() in
   src/app/i18n/route-map.ts, which carries the reason. The rule exists twice because
   this script is plain Node and cannot import the TypeScript helper; how each copy is
   pinned is described at URL_SHAPE above. There is no test that runs this generator. */
function urlOf(lang, slug) {
  const prefix = lang === 'de' ? '' : lang;
  const path = [prefix, slug].filter(Boolean).join('/');
  return path ? `${BASE}/${path}/` : `${BASE}/`;
}

/** slugsByLang: { de: '...', en?: '...' }; external: alternates on other domains, same order as SeoService. */
function entriesFor(slugsByLang, { lastmod, changefreq, priority }, external = []) {
  const langs = Object.keys(slugsByLang);
  return langs.map(lang => {
    const loc = urlOf(lang, slugsByLang[lang]);
    const alternates = [
      ...langs.map(l => ({ hreflang: l, href: urlOf(l, slugsByLang[l]) })),
      ...external,
      ...(slugsByLang.de !== undefined ? [{ hreflang: 'x-default', href: urlOf('de', slugsByLang.de) }] : []),
    ];
    return { loc, lastmod, changefreq, priority, alternates };
  });
}

const META = {
  home:    { changefreq: 'weekly',  priority: '1.0' },
  legal:   { changefreq: 'yearly',  priority: '0.3' },
  privacy: { changefreq: 'yearly',  priority: '0.3' },
  blog:    { changefreq: 'weekly',  priority: '0.8' },
};
const SERVICE_META = { changefreq: 'monthly', priority: '0.9' };
const ARTICLE_META = { changefreq: 'monthly', priority: '0.7' };

const entries = [];

for (const [key, slugsByLang] of Object.entries(routes.pages)) {
  if (key === 'notFound') continue;
  const meta = META[key] ?? SERVICE_META;
  entries.push(...entriesFor(slugsByLang, { lastmod: today, ...meta }, key === 'home' ? HOME_EXTERNAL : []));
}

for (const article of registry.articles) {
  const blogSlugs = routes.pages.blog;
  const slugsByLang = {};
  for (const [lang, slug] of Object.entries(article.slugs)) {
    if (blogSlugs[lang] === undefined) continue;
    slugsByLang[lang] = `${blogSlugs[lang]}/${slug}`;
  }
  entries.push(...entriesFor(slugsByLang, { lastmod: article.dateIso, ...ARTICLE_META }));
}

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  entries
    .map(e =>
      '  <url>\n' +
      `    <loc>${e.loc}</loc>\n` +
      e.alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`).join('') +
      `    <lastmod>${e.lastmod}</lastmod>\n` +
      `    <changefreq>${e.changefreq}</changefreq>\n` +
      `    <priority>${e.priority}</priority>\n` +
      '  </url>',
    )
    .join('\n') +
  '\n</urlset>\n';

if (!existsSync(OUT_DIR)) {
  console.error(`Output directory not found: ${OUT_DIR} — run "ng build" first.`);
  process.exit(1);
}

const own = entries.flatMap(e => [e.loc, ...e.alternates.map(a => a.href)]).filter(u => u.startsWith(BASE));

const malformed = own.filter(u => !PATH_SHAPE.test(new URL(u).pathname));
if (malformed.length) {
  console.error('Sitemap URLs do not match the form the server serves (see PATH_SHAPE):');
  for (const u of malformed) console.error(`  ${u}`);
  process.exit(1);
}

/* A shaped URL can still point nowhere: rename a slug in routes.json and the sitemap
   advertises a directory that was never prerendered. The build output is right here,
   so ask it. */
const unbuilt = [...new Set(own)].filter(
  u => !existsSync(join(OUT_DIR, new URL(u).pathname.slice(1), 'index.html')),
);
if (unbuilt.length) {
  console.error('Sitemap lists URLs that were not prerendered — check routes.json against the build:');
  for (const u of unbuilt) console.error(`  ${u}`);
  process.exit(1);
}

writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml);
console.log(`sitemap.xml written with ${entries.length} URLs.`);
