import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { SeoService, SeoPageInfo } from './seo.service';
import { SITE_CONFIG } from '../config/site.config';

const BASE = SITE_CONFIG.baseUrl;

/** A service page as it exists in both locales. */
const servicePage: SeoPageInfo = {
  title: 'Website erstellen lassen',
  description: 'Individuelle Websites für kleine Unternehmen.',
  lang: 'de',
  paths: { de: 'website-erstellen-lassen', en: 'en/website-development' },
};

const TR_HOME = 'https://softlyx.tr/';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;

  const hreflangs = () =>
    [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')].map(el => [
      el.getAttribute('hreflang'),
      el.getAttribute('href'),
    ]);

  const metaContent = (selector: string) =>
    document.head.querySelector<HTMLMetaElement>(selector)?.content;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
    // The real index.html ships a canonical link; recreate that starting point.
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${BASE}/`);
    document.head.appendChild(canonical);
  });

  afterEach(() => {
    document.head
      .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], meta, #page-jsonld')
      .forEach(el => el.remove());
  });

  describe('update', () => {
    it('points the canonical URL at the current locale, not the site root', () => {
      service.update({ ...servicePage, lang: 'en' });

      const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      expect(canonical?.href).toBe(`${BASE}/en/website-development/`);
    });

    it('writes the German home page as a bare root URL', () => {
      service.update({ title: 'Home', description: 'd', lang: 'de', paths: { de: '' } });

      expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
        .toBe(`${BASE}/`);
    });

    // Everything this service builds itself — external alternates are passed in
    // verbatim and are covered by their own case below.
    const ownUrls = () => [
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
      metaContent('meta[property="og:url"]'),
      ...hreflangs()
        .filter(([, href]) => href?.startsWith(BASE))
        .map(([, href]) => href),
    ];

    it('emits every URL in the form the server serves: closed by one slash', () => {
      // The server only serves the directory form (/blog -> 301 -> /blog/).
      service.update(servicePage);

      expect(ownUrls()).toHaveLength(5);
      // scheme + host + optional non-empty segments, always closed by exactly one slash
      for (const url of ownUrls()) {
        expect(url ?? '(tag missing)').toMatch(/^https:\/\/[^/]+\/(?:[^/]+\/)*$/);
      }
    });

    it('normalises a stray slash instead of doubling it', () => {
      // urlPathFor yields no slash at either end today, so nothing in the app reaches
      // this. It pins the guarantee absoluteUrl gives, so the next caller can rely on it.
      service.update({ title: 'Blog', description: 'd', lang: 'de', paths: { de: '/blog/' } });

      // canonical, og:url, hreflang="de", x-default — the page exists in German only
      expect(ownUrls()).toHaveLength(4);
      for (const url of ownUrls()) {
        expect(url ?? '(tag missing)').toMatch(/^https:\/\/[^/]+\/(?:[^/]+\/)*$/);
      }
    });

    it('emits one hreflang per locale plus x-default pointing at German', () => {
      service.update(servicePage);

      expect(hreflangs()).toEqual([
        ['de', `${BASE}/website-erstellen-lassen/`],
        ['en', `${BASE}/en/website-development/`],
        ['x-default', `${BASE}/website-erstellen-lassen/`],
      ]);
    });

    it('emits no Turkish hreflang of its own — Turkish is not a locale of this site', () => {
      service.update(servicePage);

      expect(hreflangs().map(([lang]) => lang)).not.toContain('tr');
    });

    it('appends external alternates verbatim, between the own locales and x-default', () => {
      // Cross-domain hreflang, the MediaMarkt pattern: the Turkish home on its own domain.
      service.update({ ...servicePage, externalAlternates: [{ hreflang: 'tr', href: TR_HOME }] });

      expect(hreflangs()).toEqual([
        ['de', `${BASE}/website-erstellen-lassen/`],
        ['en', `${BASE}/en/website-development/`],
        ['tr', TR_HOME],
        ['x-default', `${BASE}/website-erstellen-lassen/`],
      ]);
    });

    it('drops external alternates on navigation to a page that has none', () => {
      service.update({ ...servicePage, externalAlternates: [{ hreflang: 'tr', href: TR_HOME }] });
      service.update(servicePage);

      expect(hreflangs().map(([lang]) => lang)).toEqual(['de', 'en', 'x-default']);
    });

    it('omits locales the page does not exist in', () => {
      // The blog has no English translation.
      service.update({
        title: 'Blog', description: 'd', lang: 'de', paths: { de: 'blog' },
      });

      expect(hreflangs().map(([lang]) => lang)).toEqual(['de', 'x-default']);
    });

    it('replaces hreflang links on navigation instead of accumulating them', () => {
      service.update(servicePage);
      service.update({
        title: 'Blog', description: 'd', lang: 'de', paths: { de: 'blog' },
      });

      expect(hreflangs()).toHaveLength(2);
    });

    it('maps the language to an OpenGraph locale and lists the others as alternates', () => {
      service.update({ ...servicePage, lang: 'en' });

      expect(metaContent('meta[property="og:locale"]')).toBe('en_US');
      const alternates = [...document.head.querySelectorAll('meta[property="og:locale:alternate"]')]
        .map(el => el.getAttribute('content'));
      expect(alternates).toEqual(['de_DE']);
    });

    it('does not accumulate og:locale:alternate tags across navigations', () => {
      service.update(servicePage);
      service.update(servicePage);

      expect(document.head.querySelectorAll('meta[property="og:locale:alternate"]')).toHaveLength(1);
    });

    it('mirrors title and description into the OpenGraph and Twitter tags', () => {
      service.update(servicePage);

      expect(TestBed.inject(Title).getTitle()).toBe(servicePage.title);
      expect(metaContent('meta[property="og:title"]')).toBe(servicePage.title);
      expect(metaContent('meta[name="twitter:title"]')).toBe(servicePage.title);
      expect(metaContent('meta[name="description"]')).toBe(servicePage.description);
      expect(metaContent('meta[property="og:description"]')).toBe(servicePage.description);
    });

    it('falls back to the default share image when the page brings none', () => {
      service.update(servicePage);
      expect(metaContent('meta[property="og:image"]')).toBe(`${BASE}/assets/img/og-image.jpg`);

      service.update({ ...servicePage, ogImage: `${BASE}/assets/img/custom.jpg` });
      expect(metaContent('meta[property="og:image"]')).toBe(`${BASE}/assets/img/custom.jpg`);
      expect(metaContent('meta[name="twitter:image"]')).toBe(`${BASE}/assets/img/custom.jpg`);
    });
  });

  describe('setJsonLd', () => {
    it('injects the payload as a parseable ld+json script', () => {
      service.setJsonLd({ '@type': 'BlogPosting', headline: 'Test' });

      const script = document.getElementById('page-jsonld') as HTMLScriptElement;
      expect(script.type).toBe('application/ld+json');
      expect(JSON.parse(script.textContent)).toEqual({ '@type': 'BlogPosting', headline: 'Test' });
    });

    it('keeps a single slot — a second call replaces the first', () => {
      service.setJsonLd({ headline: 'First' });
      service.setJsonLd({ headline: 'Second' });

      const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts).toHaveLength(1);
      expect(JSON.parse(scripts[0].textContent)).toEqual({ headline: 'Second' });
    });

    it('clearJsonLd removes the script and is safe to call twice', () => {
      service.setJsonLd({ headline: 'First' });

      service.clearJsonLd();
      service.clearJsonLd();

      expect(document.getElementById('page-jsonld')).toBeNull();
    });
  });
});
