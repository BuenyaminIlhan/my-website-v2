import { describe, it, expect } from 'vitest';
import { slugFor, urlPathFor, urlPathsFor, blogArticleUrlPath, blogArticleUrlPaths } from './route-map';
import { SUPPORTED_LOCALES } from './translations';
import routesJson from './routes.json';
import blogRegistry from '../blog/blog-registry.json';

describe('route-map', () => {
  describe('urlPathFor', () => {
    it('keeps German at the site root without a locale prefix', () => {
      expect(urlPathFor('home', 'de')).toBe('');
      expect(urlPathFor('legal', 'de')).toBe('legal-notice');
    });

    it('prefixes every non-German locale with its language code', () => {
      expect(urlPathFor('home', 'en')).toBe('en');
      expect(urlPathFor('legal', 'en')).toBe('en/legal-notice');
    });

    it('uses the localized slug, not the German one, for service pages', () => {
      expect(urlPathFor('website-erstellen-lassen', 'de')).toBe('website-erstellen-lassen');
      expect(urlPathFor('website-erstellen-lassen', 'en')).toBe('en/website-development');
    });

    it('returns undefined for an unknown page key instead of throwing', () => {
      // pagePath() casts an unvalidated string to PageKey, so this is reachable at runtime.
      expect(slugFor('no-such-page' as never, 'de')).toBeUndefined();
      expect(urlPathFor('no-such-page' as never, 'de')).toBeUndefined();
    });

    it('returns undefined for a page that does not exist in a locale', () => {
      // The blog is only published in German.
      expect(slugFor('blog', 'en')).toBeUndefined();
      expect(urlPathFor('blog', 'en')).toBeUndefined();
    });
  });

  describe('urlPathsFor', () => {
    it('lists every locale a page exists in — input for canonical + hreflang', () => {
      expect(urlPathsFor('privacy')).toEqual({
        de: 'privacy-policy',
        en: 'en/privacy-policy',
      });
    });

    it('lists exactly the supported locales for a page that exists everywhere', () => {
      expect(Object.keys(urlPathsFor('home'))).toEqual(['de', 'en']);
      expect(SUPPORTED_LOCALES).toEqual(['de', 'en']);
    });

    it('omits locales where the page is missing instead of falling back', () => {
      const paths = urlPathsFor('blog');
      expect(paths).toEqual({ de: 'blog' });
      expect('en' in paths).toBe(false);
    });
  });

  describe('blogArticleUrlPath', () => {
    it('composes the localized blog base with the localized article slug', () => {
      expect(blogArticleUrlPath('website-kosten-handwerker', 'de'))
        .toBe('blog/was-kostet-eine-website-fuer-handwerker');
      expect(blogArticleUrlPaths('website-kosten-handwerker'))
        .toEqual({ de: 'blog/was-kostet-eine-website-fuer-handwerker' });
    });

    it('returns undefined where the article has no translation', () => {
      expect(blogArticleUrlPath('website-kosten-handwerker', 'en')).toBeUndefined();
    });

    it('returns undefined for an unknown article id', () => {
      expect(blogArticleUrlPath('does-not-exist', 'de')).toBeUndefined();
      expect(blogArticleUrlPaths('does-not-exist')).toEqual({});
    });
  });

  describe('slug tables', () => {
    // Guards against Turkish quietly coming back: a "tr" slug here would be
    // silently ignored by the route tree but would still leak into the sitemap.
    const supported = new Set<string>(SUPPORTED_LOCALES);

    it('routes.json only names supported locales', () => {
      for (const [key, slugs] of Object.entries(routesJson.pages)) {
        const foreign = Object.keys(slugs).filter(l => !supported.has(l));
        expect(foreign, `page "${key}"`).toEqual([]);
      }
    });

    it('blog-registry.json only names supported locales', () => {
      for (const article of blogRegistry.articles) {
        const foreign = Object.keys(article.slugs).filter(l => !supported.has(l));
        expect(foreign, `article "${article.id}"`).toEqual([]);
      }
    });
  });
});
