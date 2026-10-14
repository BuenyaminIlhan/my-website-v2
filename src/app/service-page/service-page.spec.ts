import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ServicePage } from './service-page';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { text } from '../../testing/fixture';
import { SITE_CONFIG } from '../config/site.config';
import { articleById, articleContent, blogArticles } from '../blog/blog-data';
import { de } from '../i18n/de';
import { en } from '../i18n/en';
import { ContentLink, Lang, LangTranslations } from '../i18n/translations';
import { blogArticleUrlPath, urlPathFor } from '../i18n/route-map';
import { handwerkerPage } from '../i18n/de-handwerker';


/**
 * Every number in a text as one whole token — thousands dots AND decimals included:
 * "€ 1.500–7.000" gives ["1.500", "7.000"], "0,99 €" gives ["0,99"], "1.5000" stays
 * "1.5000". Deliberately blind to currency and wording: the test below checks EVERY
 * number on the page, so a price cannot hide in its spelling.
 */
const numbersIn = (text: string): string[] => text.match(/(?<![\d.,])\d+(?:[.,]\d+)*/g) ?? [];

/**
 * Phrases on the craftsmen page that contain a number but no price, each with the place on
 * the site that already states it. They are removed before counting — whole phrases, not
 * bare digits, so "24 € im Monat" cannot ride on "24 Stunden".
 */
const NON_PRICE_PHRASES: Record<string, string> = {
  '24 Stunden': 'reply within 24 hours — process step 1 and hero badges in de.ts',
  '3D-': '"3D-Gebäudedaten" — the Dachplaner text in portfolio.ts',
};

describe('ServicePage', () => {
  let fixture: ComponentFixture<ServicePage>;
  let lang: LangService;

  const mount = (slug: string) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { data: { slug } } } }],
    });
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', slug as never);

    fixture = TestBed.createComponent(ServicePage);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('renders the service the route points at', () => {
    mount('web-app-entwicklung');

    const content = lang.t().servicePages['web-app-entwicklung'];
    expect(fixture.componentInstance.content()).toBe(content);
    expect(text(fixture)).toContain(content.h1);
  });

  it('sets the page title from the service content', () => {
    mount('website-optimierung');

    expect(TestBed.inject(Title).getTitle()).toBe(lang.t().servicePages['website-optimierung'].metaTitle);
  });

  it('follows a language switch', () => {
    mount('sorglos-paket');

    lang.applyRoute('en', 'sorglos-paket');
    fixture.detectChanges();

    expect(fixture.componentInstance.content()).toBe(lang.t().servicePages['sorglos-paket']);
  });

  it('prefills the contact wizard with the matching project type', () => {
    mount('website-erstellen-lassen');

    fixture.componentInstance.prefillContact();

    expect(TestBed.inject(InquiryService).projectType()).toBe('website');
  });

  describe('structured data', () => {
    type Node = Record<string, unknown>;
    const graph = (): Node[] =>
      (JSON.parse(document.getElementById('page-jsonld')?.textContent ?? '{}') as { '@graph'?: Node[] })['@graph'] ?? [];
    const node = (type: string): Node => {
      const found = graph().find(n => n['@type'] === type);
      if (!found) throw new Error(`no ${type} node`);
      return found;
    };

    beforeEach(() => {
      // index.html ships a canonical link; SeoService only updates an existing one.
      const canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    });

    afterEach(() => {
      document.getElementById('page-jsonld')?.remove();
      document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
        .forEach(el => el.remove());
    });

    it('publishes a breadcrumb from the home page to this service', () => {
      mount('website-erstellen-lassen');

      const items = node('BreadcrumbList')['itemListElement'] as Node[];
      const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
      expect(items.map(i => i['position'])).toEqual([1, 2]);
      expect(items[0]['item']).toBe(`${SITE_CONFIG.baseUrl}/`);
      expect(items[0]['name']).toBe('Startseite');
      expect(items[1]['item']).toBe(canonical);
      expect(items[1]['item']).toBe(`${SITE_CONFIG.baseUrl}/website-erstellen-lassen/`);
      expect(items[1]['name']).toBe(lang.t().servicePages['website-erstellen-lassen'].h1);
    });

    it('describes the service as offered by the business on the home page', () => {
      mount('web-app-entwicklung');

      const service = node('Service');
      expect(service['name']).toBe(lang.t().servicePages['web-app-entwicklung'].h1);
      expect(service['description']).toBe(lang.t().servicePages['web-app-entwicklung'].metaDescription);
      expect((service['provider'] as Node)['@id']).toBe(`${SITE_CONFIG.baseUrl}/#service`);
      expect(service['url']).toBe(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href);
    });

    it('follows a language switch', () => {
      mount('sorglos-paket');

      lang.applyRoute('en', 'sorglos-paket');
      fixture.detectChanges();
      TestBed.tick();

      expect(node('Service')['name']).toBe(lang.t().servicePages['sorglos-paket'].h1);
      expect(node('Service')['inLanguage']).toBe('en');
      // The addresses have to follow the language too, not only the texts.
      const items = node('BreadcrumbList')['itemListElement'] as Node[];
      expect(items[0]['name']).toBe('Home');
      expect(items[0]['item']).toBe(`${SITE_CONFIG.baseUrl}/en/`);
      expect(items[1]['item']).toBe(`${SITE_CONFIG.baseUrl}/en/care-free-package/`);
      expect(node('Service')['url']).toBe(`${SITE_CONFIG.baseUrl}/en/care-free-package/`);
    });

    it('removes its data when the page is left', () => {
      mount('website-optimierung');
      expect(document.getElementById('page-jsonld')).not.toBeNull();

      fixture.destroy();

      expect(document.getElementById('page-jsonld')).toBeNull();
    });
  });

  it('leaves the project type empty for a slug the wizard does not know', () => {
    mount('website-erstellen-lassen');
    fixture.componentInstance.slug = 'not-an-offer';

    fixture.componentInstance.prefillContact();

    expect(TestBed.inject(InquiryService).projectType()).toBe('');
  });
  describe('the craftsmen page', () => {
    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

    // Runs even when an assertion failed, so no script leaks into later tests.
    afterEach(() => document.getElementById('page-jsonld')?.remove());

    /** The craftsmen page's content — it always has sections, a table and questions. */
    const craftsmen = () => {
      mount('website-fuer-handwerker');
      const page = lang.t().servicePages['website-fuer-handwerker'];
      const sections = page.sections ?? [];
      const table = sections.find(s => s.table)?.table ?? { head: [], rows: [] };
      return { sections, table, faq: page.faq?.items ?? [] };
    };

    it('renders every section heading and the four steps, without the block of the short pages', () => {
      const { sections } = craftsmen();
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) expect(text(fixture)).toContain(section.h2);
      expect(el().querySelectorAll('.service-section ol > li')).toHaveLength(4);
      const standalone = Array.from(el().querySelectorAll('.included-list')).filter(ul => !ul.closest('.service-section'));
      expect(standalone).toHaveLength(0);
    });

    it('renders the price table with row headers and a column label on every cell', () => {
      const { table } = craftsmen();
      expect(table.rows).toHaveLength(3);
      expect(el().querySelectorAll('.service-section table tbody tr')).toHaveLength(table.rows.length);
      // Each cell of a row carries its column name — the phone layout labels by it.
      const firstRow = Array.from(el().querySelectorAll('.service-section table tbody tr:first-child > *'));
      expect(firstRow.map(c => c.getAttribute('data-label'))).toEqual(table.head);
      expect(firstRow[0].tagName).toBe('TH');
      expect(firstRow[0].getAttribute('scope')).toBe('row');
    });

    it('renders the questions with question and answer in the right places', () => {
      const { faq } = craftsmen();
      expect(faq).toHaveLength(4);
      expect(el().querySelectorAll('.service-faq details')).toHaveLength(faq.length);
      expect(el().querySelector('.service-faq summary')?.textContent).toBe(faq[0].q);
      expect(el().querySelector('.service-faq details p')?.textContent).toBe(faq[0].a);
    });

    it('links the price section to the cost article', () => {
      mount('website-fuer-handwerker');
      const hrefs = Array.from(el().querySelectorAll<HTMLAnchorElement>('.related-link a')).map(a => a.getAttribute('href'));
      expect(hrefs).toContain('/blog/was-kostet-eine-website-fuer-handwerker');
    });

    it('survives a switch to English, where the page does not exist', () => {
      // The header's language switch applies the English locale while this German-only
      // page is still mounted; its content lookup is then undefined.
      mount('website-fuer-handwerker');
      const title = TestBed.inject(Title).getTitle();

      expect(() => {
        lang.applyRoute('en', 'home');
        fixture.detectChanges();
        TestBed.tick();
      }).not.toThrow();
      // Nothing of this page is written over with undefined values on the way out.
      expect(TestBed.inject(Title).getTitle()).toBe(title);
      document.getElementById('page-jsonld')?.remove();
    });

    it('prefills the contact wizard with "website"', () => {
      mount('website-fuer-handwerker');
      fixture.componentInstance.prefillContact();
      expect(TestBed.inject(InquiryService).projectType()).toBe('website');
    });

    it('reads every number as one whole token, decimals included', () => {
      expect(numbersIn('ab € 1.500–7.000 einmalig')).toEqual(['1.500', '7.000']);
      expect(numbersIn('EUR 1.500 bis 9.000, Euro 9.999, 1.500,– €, 2999 EUR')).toEqual(['1.500', '9.000', '9.999', '1.500', '2999']);
      expect(numbersIn('ab 0,99 € im Monat, 24,90 €, 1.500,99 €, 1.5000 €')).toEqual(['0,99', '24,90', '1.500,99', '1.5000']);
      expect(numbersIn('zwölf Unterseiten')).toEqual([]);
    });

    it('states only numbers the cost article states — nothing invented, in any spelling', () => {
      const article = articleContent(articleById('website-kosten-handwerker'), 'de');
      // The article's own text, not its metadata ("2026" in the title, the date, reading time).
      const allowed = new Set(numbersIn(JSON.stringify([article.teaser, article.intro, article.sections])));
      // The whole content object: rendered text, title and description (what Google shows).
      let text = JSON.stringify(handwerkerPage);
      for (const phrase of Object.keys(NON_PRICE_PHRASES)) text = text.split(phrase).join(' ');
      const found = numbersIn(text);
      expect(found.length).toBeGreaterThan(0);
      for (const n of found) expect(allowed.has(n), n).toBe(true);
      // Whole tokens: neither "500" (inside "1.500") nor "0,99" (next to the "0" of "0 Euro").
      expect(allowed.has('500')).toBe(false);
      expect(allowed.has('0,99')).toBe(false);
    });

    it('names the page itself as the last breadcrumb', () => {
      mount('website-fuer-handwerker');
      const graph = JSON.parse(document.getElementById('page-jsonld')?.textContent ?? '{}') as
        { '@graph': { '@type': string; itemListElement?: { item: string }[] }[] };
      const crumbs = graph['@graph'].find(n => n['@type'] === 'BreadcrumbList')?.itemListElement ?? [];
      expect(crumbs.at(-1)?.item).toBe(`${SITE_CONFIG.baseUrl}/website-fuer-handwerker/`);
      document.getElementById('page-jsonld')?.remove();
    });

    it('is pointed to from "Website erstellen lassen"', () => {
      mount('website-erstellen-lassen');
      const link = el().querySelector<HTMLAnchorElement>('.related-link a');
      expect(link?.getAttribute('href')).toBe('/website-fuer-handwerker');
    });

    for (const slug of ['website-erstellen-lassen', 'web-app-entwicklung', 'website-optimierung', 'sorglos-paket']) {
      it(`leaves the short layout of "${slug}" as it was`, () => {
        mount(slug);
        expect(el().querySelector('.included-list')).not.toBeNull();
        expect(el().querySelectorAll('.service-section')).toHaveLength(0);
        expect(el().querySelector('.service-faq')).toBeNull();
        expect(Array.from(el().querySelectorAll('h2')).every(h => (h.textContent ?? '').trim() !== '')).toBe(true);
      });
    }

    it('falls back to the locale home for an article link where the locale has no blog', () => {
      mount('website-fuer-handwerker');
      lang.applyRoute('en', 'home');
      const link: ContentLink = { text: 't', linkLabel: 'l', article: 'website-kosten-handwerker' };
      expect(fixture.componentInstance.linkPath(link)).toBe('/en');
    });
  });

  describe('content of every service page, both locales', () => {
    const LOCALES: [Lang, LangTranslations][] = [['de', de], ['en', en]];

    it('pairs every list or question block with its heading, and has a main block', () => {
      for (const [lang, t] of LOCALES) {
        for (const [key, page] of Object.entries(t.servicePages)) {
          const where = `${lang}/${key}`;
          expect(page.included === undefined, where).toBe(page.includedTitle === undefined);
          expect((page.included?.length ?? 0) + (page.sections?.length ?? 0), where).toBeGreaterThan(0);
          if (page.faq) expect(page.faq.title.trim(), where).not.toBe('');
        }
      }
    });

    it('resolves every link the content uses, in the locale that uses it', () => {
      const links = [...serviceLinks(), ...articleLinks()];
      expect(links.length).toBeGreaterThan(2);
      for (const [lang, from, link] of links) {
        const target = link.page !== undefined ? urlPathFor(link.page, lang) : blogArticleUrlPath(link.article, lang);
        expect(target, `${lang}/${from} → ${link.page ?? link.article}`).toBeDefined();
      }
    });

    /** Every link of a service page — on the page and in its sections — per locale. */
    const serviceLinks = (): [Lang, string, ContentLink][] =>
      LOCALES.flatMap(([lang, t]) => Object.entries(t.servicePages).flatMap(([key, page]) =>
        [page.related, ...(page.sections ?? []).map(s => s.related)]
          .filter((link): link is ContentLink => link !== undefined)
          .map((link): [Lang, string, ContentLink] => [lang, key, link])));

    /** Every service-page link of a blog article, per locale. */
    const articleLinks = (): [Lang, string, ContentLink][] =>
      blogArticles.flatMap(article => (Object.entries(article.locales) as [Lang, { relatedPage?: ContentLink }][])
        .filter(([, content]) => content.relatedPage !== undefined)
        .map(([lang, content]): [Lang, string, ContentLink] => [lang, article.id, content.relatedPage as ContentLink]));
  });
});
