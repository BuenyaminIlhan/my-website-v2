import routesJson from './routes.json';
import blogRegistry from '../blog/blog-registry.json';
import { Lang, SUPPORTED_LOCALES } from './translations';
import { SITE_CONFIG } from '../config/site.config';

export type PageKey = keyof typeof routesJson.pages;

/** URL slug of a page in a locale, undefined if the page does not exist there (e.g. blog in en). */
export function slugFor(key: PageKey, lang: Lang): string | undefined {
  // Callers may pass an unvalidated string (see LangService.pagePath) — an unknown
  // key must fall through to the caller's fallback, not throw.
  const page = routesJson.pages[key] as Partial<Record<Lang, string>> | undefined;
  return page?.[lang];
}

/**
 * Slug of a page that exists in every locale. A missing entry is a routing bug in
 * routes.json, not a runtime case — failing here beats shipping a broken route tree.
 */
export function requiredSlug(key: PageKey, lang: Lang): string {
  const slug = slugFor(key, lang);
  if (slug === undefined) throw new Error(`routes.json has no "${key}" slug for locale "${lang}"`);
  return slug;
}

/**
 * URL path (relative to the site root, no leading slash) of a page in a locale.
 * '' = German home, 'en' = English home, 'en/website-development', …
 */
export function urlPathFor(key: PageKey, lang: Lang): string | undefined {
  const slug = slugFor(key, lang);
  if (slug === undefined) return undefined;
  const prefix = lang === 'de' ? '' : lang;
  return [prefix, slug].filter(Boolean).join('/');
}

/**
 * Absolute URL of a path, always closed by exactly one slash — the only form this
 * site serves. Every page is prerendered into its own directory, so Apache's
 * DirectorySlash answers `/blog` with a 301 to `/blog/` (measured 2026-09-10; only
 * the root already ends in a slash). A canonical, hreflang or JSON-LD URL without
 * the slash therefore names an address that never answers 200.
 *
 * Every absolute URL of an own page goes through here. It used to be built in three
 * places, and the third one was missed when the slash was introduced — that is the
 * reason this function exists rather than a local helper per caller.
 *
 * The paths above carry no slash at either end, but this is the single owner of the
 * rule and public, so it normalises rather than trusting its callers: a stray slash
 * on either side is stripped instead of doubled.
 */
export function absoluteUrl(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `${SITE_CONFIG.baseUrl}/${trimmed}/` : `${SITE_CONFIG.baseUrl}/`;
}

/** Home path of a locale — '' for German, the locale prefix otherwise. Always defined, unlike urlPathFor. */
export function homePathFor(lang: Lang): string {
  return urlPathFor('home', lang) ?? (lang === 'de' ? '' : lang);
}

/** URL paths of a page in every locale where it exists — input for canonical + hreflang. */
export function urlPathsFor(key: PageKey): Partial<Record<Lang, string>> {
  const paths: Partial<Record<Lang, string>> = {};
  for (const lang of SUPPORTED_LOCALES) {
    const p = urlPathFor(key, lang);
    if (p !== undefined) paths[lang] = p;
  }
  return paths;
}

export function blogArticleUrlPath(articleId: string, lang: Lang): string | undefined {
  const entry = blogRegistry.articles.find(a => a.id === articleId);
  const slug = entry ? (entry.slugs as Partial<Record<Lang, string>>)[lang] : undefined;
  const blogBase = urlPathFor('blog', lang);
  if (slug === undefined || blogBase === undefined) return undefined;
  return blogBase + '/' + slug;
}

export function blogArticleUrlPaths(articleId: string): Partial<Record<Lang, string>> {
  const paths: Partial<Record<Lang, string>> = {};
  for (const lang of SUPPORTED_LOCALES) {
    const p = blogArticleUrlPath(articleId, lang);
    if (p !== undefined) paths[lang] = p;
  }
  return paths;
}
