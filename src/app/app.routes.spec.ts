import { describe, it, expect } from 'vitest';
import { Route, Routes } from '@angular/router';
import { routes } from './app.routes';
import { articlesFor } from './blog/blog-data';
import { slugFor } from './i18n/route-map';
import { Lang, SUPPORTED_LOCALES } from './i18n/translations';

/** The routes of one locale: the children of /en, the top level for German. */
const treeFor = (lang: Lang): Routes => {
  if (lang === 'de') return routes.filter(r => r.path !== 'en');
  return routes.find(r => r.path === lang)?.children ?? [];
};

const paths = (lang: Lang) => treeFor(lang).map(r => r.path);

describe('route tree', () => {
  it('prefixes English and leaves German unprefixed', () => {
    expect(routes[0].path).toBe('en');
    expect(routes.slice(1).some(r => r.path === 'en')).toBe(false);
  });

  it('has no Turkish tree — the Turkish site lives on its own domain', () => {
    // The web server 301s /tr/... to that domain; should a request slip through,
    // the German catch-all must answer, not a Turkish page.
    expect(routes.some(r => r.path === 'tr')).toBe(false);
    expect(paths('de').some(p => p === 'tr' || p?.startsWith('tr/'))).toBe(false);
    expect(paths('de')).toContain('**');
  });

  it('gives every locale its own slugs', () => {
    expect(paths('de')).toContain('website-erstellen-lassen');
    expect(paths('en')).toContain('website-development');
  });

  it('uses the localized legal and privacy slugs', () => {
    expect(paths('en')).toContain(slugFor('legal', 'en'));
    expect(paths('en')).toContain(slugFor('privacy', 'en'));
  });

  for (const lang of SUPPORTED_LOCALES) {
    it(`${lang}: guards every route and ends on the catch-all`, () => {
      const tree = treeFor(lang);

      expect(tree.every((r: Route) => r.canActivate?.length === 1)).toBe(true);
      expect(tree.every((r: Route) => r.data?.['lang'] === lang)).toBe(true);
      expect(tree[tree.length - 1].path).toBe('**');
      expect(tree.filter(r => r.path === '**')).toHaveLength(1);
    });
  }

  it('publishes one route per blog article in German, the only locale with a blog', () => {
    for (const lang of ['de'] as Lang[]) {
      const blogSlug = slugFor('blog', lang);
      expect(paths(lang)).toContain(blogSlug);

      for (const article of articlesFor(lang)) {
        expect(paths(lang)).toContain(`${blogSlug}/${article.slugs[lang]}`);
      }
    }
  });

  it('has no blog routes in English, where the blog does not exist', () => {
    expect(slugFor('blog', 'en')).toBeUndefined();
    expect(paths('en').some(p => p?.startsWith('blog'))).toBe(false);
  });

  it('every route lazy-loads a component that actually exists', async () => {
    const loaders = SUPPORTED_LOCALES
      .flatMap(treeFor)
      .map(r => r.loadComponent)
      .filter((l): l is NonNullable<Route['loadComponent']> => l !== undefined);

    expect(loaders).toHaveLength(routes.length - 1 + treeFor('en').length);

    for (const load of loaders) {
      expect(await load()).toBeTruthy();
    }
  });

  it('carries the article id into the route data so the page can look it up', () => {
    const articleRoute = treeFor('de').find(r => r.data?.['articleId'] !== undefined);

    expect(articleRoute).toBeDefined();
    expect(articlesFor('de').map(a => a.id)).toContain(articleRoute?.data?.['articleId']);
  });
});
