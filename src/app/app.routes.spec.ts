import { describe, it, expect } from 'vitest';
import { Route, Routes } from '@angular/router';
import { routes } from './app.routes';
import { articlesFor } from './blog/blog-data';
import { slugFor } from './i18n/route-map';
import { Lang } from './i18n/translations';

/** The routes of one locale: the children of /en and /tr, the top level for German. */
const treeFor = (lang: Lang): Routes => {
  if (lang === 'de') return routes.filter(r => r.path !== 'en' && r.path !== 'tr');
  return routes.find(r => r.path === lang)?.children ?? [];
};

const paths = (lang: Lang) => treeFor(lang).map(r => r.path);

describe('route tree', () => {
  it('prefixes English and Turkish and leaves German unprefixed', () => {
    expect(routes[0].path).toBe('en');
    expect(routes[1].path).toBe('tr');
    expect(routes.slice(2).some(r => r.path === 'en' || r.path === 'tr')).toBe(false);
  });

  it('gives every locale its own slugs', () => {
    expect(paths('de')).toContain('website-erstellen-lassen');
    expect(paths('en')).toContain('website-development');
    expect(paths('tr')).toContain('web-sitesi-yaptirma');
  });

  it('uses the localized legal and privacy slugs', () => {
    expect(paths('tr')).toContain(slugFor('legal', 'tr'));
    expect(paths('tr')).toContain(slugFor('privacy', 'tr'));
  });

  for (const lang of ['de', 'en', 'tr'] as Lang[]) {
    it(`${lang}: guards every route and ends on the catch-all`, () => {
      const tree = treeFor(lang);

      expect(tree.every((r: Route) => r.canActivate?.length === 1)).toBe(true);
      expect(tree.every((r: Route) => r.data?.['lang'] === lang)).toBe(true);
      expect(tree[tree.length - 1].path).toBe('**');
      expect(tree.filter(r => r.path === '**')).toHaveLength(1);
    });
  }

  it('publishes one route per blog article in the locales that have a blog', () => {
    for (const lang of ['de', 'tr'] as Lang[]) {
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
    const loaders = (['de', 'en', 'tr'] as Lang[])
      .flatMap(treeFor)
      .map(r => r.loadComponent)
      .filter((l): l is NonNullable<Route['loadComponent']> => l !== undefined);

    expect(loaders).toHaveLength(routes.length - 2 + treeFor('en').length + treeFor('tr').length);

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
