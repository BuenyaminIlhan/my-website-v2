import { describe, it, expect } from 'vitest';
import { slugFor, urlPathFor, urlPathsFor, blogArticleUrlPath, blogArticleUrlPaths } from './route-map';

describe('route-map', () => {
  describe('urlPathFor', () => {
    it('keeps German at the site root without a locale prefix', () => {
      expect(urlPathFor('home', 'de')).toBe('');
      expect(urlPathFor('legal', 'de')).toBe('legal-notice');
    });

    it('prefixes every non-German locale with its language code', () => {
      expect(urlPathFor('home', 'en')).toBe('en');
      expect(urlPathFor('home', 'tr')).toBe('tr');
      expect(urlPathFor('legal', 'tr')).toBe('tr/kunye');
    });

    it('uses the localized slug, not the German one, for service pages', () => {
      expect(urlPathFor('website-erstellen-lassen', 'de')).toBe('website-erstellen-lassen');
      expect(urlPathFor('website-erstellen-lassen', 'en')).toBe('en/website-development');
      expect(urlPathFor('website-erstellen-lassen', 'tr')).toBe('tr/web-sitesi-yaptirma');
    });

    it('returns undefined for an unknown page key instead of throwing', () => {
      // pagePath() casts an unvalidated string to PageKey, so this is reachable at runtime.
      expect(slugFor('no-such-page' as never, 'de')).toBeUndefined();
      expect(urlPathFor('no-such-page' as never, 'de')).toBeUndefined();
    });

    it('returns undefined for a page that does not exist in a locale', () => {
      // The blog is only published in de and tr.
      expect(slugFor('blog', 'en')).toBeUndefined();
      expect(urlPathFor('blog', 'en')).toBeUndefined();
    });
  });

  describe('urlPathsFor', () => {
    it('lists every locale a page exists in — input for canonical + hreflang', () => {
      expect(urlPathsFor('privacy')).toEqual({
        de: 'privacy-policy',
        en: 'en/privacy-policy',
        tr: 'tr/gizlilik-politikasi',
      });
    });

    it('omits locales where the page is missing instead of falling back', () => {
      const paths = urlPathsFor('blog');
      expect(paths).toEqual({ de: 'blog', tr: 'tr/blog' });
      expect('en' in paths).toBe(false);
    });
  });

  describe('blogArticleUrlPath', () => {
    it('composes the localized blog base with the localized article slug', () => {
      expect(blogArticleUrlPath('website-kosten-handwerker', 'de'))
        .toBe('blog/was-kostet-eine-website-fuer-handwerker');
      expect(blogArticleUrlPath('website-kosten-handwerker', 'tr'))
        .toBe('tr/blog/esnaf-icin-web-sitesi-maliyeti');
    });

    it('returns undefined where the article has no translation', () => {
      expect(blogArticleUrlPath('website-kosten-handwerker', 'en')).toBeUndefined();
    });

    it('returns undefined for an unknown article id', () => {
      expect(blogArticleUrlPath('does-not-exist', 'de')).toBeUndefined();
      expect(blogArticleUrlPaths('does-not-exist')).toEqual({});
    });
  });
});
