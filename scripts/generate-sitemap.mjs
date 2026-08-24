// Generates dist/my-website-v2/browser/sitemap.xml with hreflang alternates
// for all locales, from the same route map the app uses. Runs after `ng build`
// (wired into the npm "build" script).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://ilhan-buenyamin.com';
const OUT_DIR = join(root, 'dist', 'my-website-v2', 'browser');

const routes = JSON.parse(readFileSync(join(root, 'src/app/i18n/routes.json'), 'utf8'));
const registry = JSON.parse(readFileSync(join(root, 'src/app/blog/blog-registry.json'), 'utf8'));

const today = new Date().toISOString().slice(0, 10);

function urlOf(lang, slug) {
  const prefix = lang === 'de' ? '' : lang;
  const path = [prefix, slug].filter(Boolean).join('/');
  return path ? `${BASE}/${path}` : `${BASE}/`;
}

/** slugsByLang: { de: '...', en?: '...', tr?: '...' } */
function entriesFor(slugsByLang, { lastmod, changefreq, priority }) {
  const langs = Object.keys(slugsByLang);
  return langs.map(lang => {
    const loc = urlOf(lang, slugsByLang[lang]);
    const alternates = [
      ...langs.map(l => ({ hreflang: l, href: urlOf(l, slugsByLang[l]) })),
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
  entries.push(...entriesFor(slugsByLang, { lastmod: today, ...meta }));
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

writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml);
console.log(`sitemap.xml written with ${entries.length} URLs.`);
