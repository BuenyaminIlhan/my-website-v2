import routesJson from './routes.json';
import blogRegistry from '../blog/blog-registry.json';
import { Lang } from './translations';

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
 * '' = German home, 'tr' = Turkish home, 'en/website-development', …
 */
export function urlPathFor(key: PageKey, lang: Lang): string | undefined {
  const slug = slugFor(key, lang);
  if (slug === undefined) return undefined;
  const prefix = lang === 'de' ? '' : lang;
  return [prefix, slug].filter(Boolean).join('/');
}

/** Home path of a locale — '' for German, the locale prefix otherwise. Always defined, unlike urlPathFor. */
export function homePathFor(lang: Lang): string {
  return urlPathFor('home', lang) ?? (lang === 'de' ? '' : lang);
}

/** URL paths of a page in every locale where it exists — input for canonical + hreflang. */
export function urlPathsFor(key: PageKey): Partial<Record<Lang, string>> {
  const paths: Partial<Record<Lang, string>> = {};
  for (const lang of ['de', 'en', 'tr'] as Lang[]) {
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
  for (const lang of ['de', 'en', 'tr'] as Lang[]) {
    const p = blogArticleUrlPath(articleId, lang);
    if (p !== undefined) paths[lang] = p;
  }
  return paths;
}
