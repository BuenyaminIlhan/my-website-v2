import routesJson from './routes.json';
import blogRegistry from '../blog/blog-registry.json';
import { Lang } from './translations';

export type PageKey = keyof typeof routesJson.pages;

/** URL slug of a page in a locale, undefined if the page does not exist there (e.g. blog in en). */
export function slugFor(key: PageKey, lang: Lang): string | undefined {
  return (routesJson.pages[key] as Partial<Record<Lang, string>>)[lang];
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
