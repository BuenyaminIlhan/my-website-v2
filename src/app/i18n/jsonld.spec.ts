import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { buildServicePageGraph, buildSiteGraph, e164 } from './jsonld';
import { homePathFor, PageKey } from './route-map';
import { de } from './de';
import { en } from './en';
import { Lang, LangTranslations } from './translations';
import { SeoService } from '../services/seo.service';
import { SITE_CONFIG } from '../config/site.config';
import { namesOwner } from '../../testing/owner-name';

const BASE = SITE_CONFIG.baseUrl;
const T: Record<Lang, LangTranslations> = { de, en };

/** Reads one node out of the @graph. A missing node is a broken graph, not a test case. */
function nodeOf(graph: object, type: string): Record<string, string> {
  const nodes = (graph as { '@graph': Record<string, string>[] })['@graph'];
  const node = nodes.find(n => n['@type'] === type);
  if (!node) throw new Error(`no ${type} node in the graph`);
  return node;
}

describe('buildSiteGraph', () => {
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document.head
      .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], meta')
      .forEach(el => el.remove());
  });

  /** The per-locale home URL the graph is anchored on, read from the FAQ node's @id. */
  const homeOf = (lang: Lang) => nodeOf(buildSiteGraph(lang, T[lang]), 'FAQPage')['@id'].replace(/#faq$/, '');

  for (const lang of ['de', 'en'] as Lang[]) {
    it(`names the ${lang} home page in the form the server serves`, () => {
      expect(homeOf(lang)).toBe(lang === 'de' ? `${BASE}/` : `${BASE}/en/`);
    });
  }

  it('keeps the owner\'s name out of everything Google shows (user decision 2026-10-14)', () => {
    for (const lang of ['de', 'en'] as Lang[]) {
      const t = T[lang];
      expect(namesOwner(JSON.stringify(buildSiteGraph(lang, t)))).toBe(false);
      for (const [key, page] of Object.entries(t.servicePages)) {
        expect(namesOwner(JSON.stringify(buildServicePageGraph(lang, key as PageKey, page)))).toBe(false);
        expect(namesOwner(page.metaTitle + page.metaDescription)).toBe(false);
      }
      // Titles and descriptions are what the search result shows.
      for (const text of Object.values(t.meta)) expect(namesOwner(text)).toBe(false);
    }
  });

  it('recognises the name in every spelling it could come back in, but not the domain', () => {
    // Invisible and combining characters are written as escapes on purpose: as raw
    // characters an editor could normalise them away and the case would test nothing.
    for (const spelling of ['B\u00FCnyamin', 'ILHAN', 'B&uuml;nyamin', 'Bu\u0308nyamin', 'Buenyamin',
      'Bunyamin',
      // The old LinkedIn link is exactly how it would most likely return.
      'https://www.linkedin.com/in/b%C3%BCnyamin-ilhan/',
      // Turkish dotted capital and dotless i: /i alone folds neither.
      '\u0130lhan', '\u0130LHAN', '\u0131lhan',
      // Entities: numeric in any case and padding, with or without the semicolon
      // (browsers render all of them), and entities splitting the name.
      'B&#xFC;nyamin', 'B&#xdc;NYAMIN', 'B&#x00fc;nyamin', 'B&#252;nyamin', 'B&#xFCnyamin', 'B&uumlnyamin',
      'Il&shy;han', 'I&#108;han', 'Il&lrm;han', 'Il&zwnj;han', 'Il&ZeroWidthSpace;han', 'B&uacute;nyamin',
      '&Idot;lhan', '&imath;lhan',
      // Format characters and a combining grapheme joiner splitting the name, and a
      // soft hyphen between a base letter and its combining mark.
      'Il\u200Bhan', 'Il\u200Ehan', 'Il\u200Fhan', 'Il\u034Fhan', 'Bu\u00AD\u0308nyamin',
      // One broken byte must not leave the valid ones in the same run undecoded.
      '%FF%42%C3%BCnyamin']) {
      expect(namesOwner(spelling), spelling).toBe(true);
    }
    expect(namesOwner('https://ilhan-buenyamin.com/en/')).toBe(false);
    expect(namesOwner('mail@ilhan-buenyamin.com')).toBe(false);
    expect(namesOwner('Softlyx \u2014 Web- & App-Entwicklung')).toBe(false);
    expect(namesOwner('%E0%A4%A broken escape, &#99999999; huge entity')).toBe(false);
  });

  it('gives the business the full address and the number for voice calls', () => {
    const service = nodeOf(buildSiteGraph('de', de), 'ProfessionalService') as unknown as {
      address: Record<string, string>;
      telephone: string;
    };

    expect(service.address['streetAddress']).toBe('Beethovenstr. 13');
    expect(service.address['postalCode']).toBe('53721');
    expect(service.address['addressLocality']).toBe('Siegburg');
    // Literal on purpose: it has to equal the Business Profile and the legal notice
    // (0173 2856136). WhatsApp has a different number.
    expect(service.telephone).toBe('+491732856136');
    expect(service.telephone).not.toBe(`+${SITE_CONFIG.whatsappNumber}`);
  });

  it('names the places the owner visits as its service area, in every language', () => {
    for (const [lang, t] of [['de', de], ['en', en]] as [Lang, LangTranslations][]) {
      const service = nodeOf(buildSiteGraph(lang, t), 'ProfessionalService') as unknown as {
        areaServed: { '@type': string; name: string }[];
      };
      // Literal on purpose: it has to equal the service area of the Business Profile.
      expect(service.areaServed).toEqual([
        { '@type': 'City', name: 'Siegburg' },
        { '@type': 'City', name: 'Köln' },
        { '@type': 'City', name: 'Bonn' },
        { '@type': 'AdministrativeArea', name: 'Rhein-Sieg-Kreis' },
      ]);
    }
  });

  it('keeps nationwide delivery on the service pages: only the visits are regional', () => {
    const page = de.servicePages['website-erstellen-lassen'];
    const nodes = (buildServicePageGraph('de', 'website-erstellen-lassen', page) as
      { '@graph': Record<string, unknown>[] })['@graph'];
    expect(nodes.find(n => n['@type'] === 'Service')?.['areaServed']).toEqual(['DE']);
  });

  it('answers on the home page whether the owner comes to the customer, in every language', () => {
    const questions = (lang: Lang) =>
      (nodeOf(buildSiteGraph(lang, T[lang]), 'FAQPage') as unknown as { mainEntity: { name: string }[] })
        .mainEntity.map(q => q.name);
    expect(questions('de')).toContain('Kommen Sie auch zu mir?');
    expect(questions('en')).toContain('Can you visit me in person?');
  });

  it('names the business exactly like its Business Profile, in every language', () => {
    for (const [lang, t] of [['de', de], ['en', en]] as [Lang, LangTranslations][]) {
      expect(nodeOf(buildSiteGraph(lang, t), 'ProfessionalService')['name']).toBe('Softlyx');
      expect(nodeOf(buildSiteGraph(lang, t), 'ProfessionalService')['logo']).toBe(`${BASE}/brand/avatar-square-dark.svg`);
    }
  });

  it('publishes no person: every reference points at the business node', () => {
    const graph = buildSiteGraph('de', de) as { '@graph': Record<string, unknown>[] };
    expect(graph['@graph'].map(n => n['@type'])).not.toContain('Person');
    expect(graph['@graph'].map(n => n['@type'])).not.toContain('ProfilePage');
    // A reference to #person would now point at nothing.
    expect(JSON.stringify(graph)).not.toContain('#person');
    expect(nodeOf(graph, 'WebSite')['publisher']).toEqual({ '@id': `${BASE}/#service` });
  });

  it('leaves the phone out when no number is configured, instead of publishing "+"', () => {
    expect(e164('')).toEqual({});
    expect(e164('491701234567')).toEqual({ telephone: '+491701234567' });
  });

  it('names the provider of a service page with the same @id as the business on the home page', () => {
    const page = de.servicePages['website-erstellen-lassen'];
    const nodes = (buildServicePageGraph('de', 'website-erstellen-lassen', page) as
      { '@graph': Record<string, unknown>[] })['@graph'];
    const provider = nodes.find(n => n['@type'] === 'Service')?.['provider'] as Record<string, string>;

    expect(provider['@id']).toBe(nodeOf(buildSiteGraph('de', de), 'ProfessionalService')['@id']);
    expect(provider['name']).toBe(nodeOf(buildSiteGraph('de', de), 'ProfessionalService')['name']);
  });

  it('refuses to build a service page graph for a page without a URL in that locale', () => {
    // The blog has no English page; a silent fallback would name the home page instead.
    expect(() => buildServicePageGraph('en', 'blog', de.servicePages['website-erstellen-lassen']))
      .toThrow(/no URL in locale "en"/);
  });

  it('names the site after the brand, which is what people search for', () => {
    const site = nodeOf(buildSiteGraph('de', de), 'WebSite');

    expect(site['name']).toBe('Softlyx');
  });

  it('agrees with the canonical link SeoService writes for the same page', () => {
    // Drift detector, not a revert detector: both sides read the same helper, so
    // reverting that helper keeps them equal and only the case above turns red.
    // What this catches is one of the two growing its own URL rule again — which is
    // exactly how blog-article.ts fell a slash behind (cold review 2026-09-10).
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${BASE}/`);
    document.head.appendChild(canonical);

    TestBed.inject(SeoService).update({
      title: 'Home',
      description: 'd',
      lang: 'en',
      paths: { de: '', en: homePathFor('en') },
    });
    const canonicalHref = document.head
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

    expect(homeOf('en')).toBe(canonicalHref);
  });
});

/**
 * The texts that promise visits name the same places as areaServed above: the Business
 * Profile is a service-area business, and Google compares profile and site.
 */
describe('service area in the site texts', () => {
  const PLACES: Record<Lang, string[]> = {
    de: ['Siegburg', 'Köln', 'Bonn', 'Rhein-Sieg-Kreis'],
    en: ['Siegburg', 'Cologne', 'Bonn', 'Rhein-Sieg district'],
  };
  const IN_PERSON: Record<Lang, string> = { de: 'persönlich', en: 'in person' };

  /** Every place, in whatever grammatical form the sentence needs ("im Rhein-Sieg-Kreis"). */
  const namesArea = (lang: Lang, text: string) => PLACES[lang].every(place => text.includes(place));

  for (const lang of ['de', 'en'] as Lang[]) {
    it(`offers the first meeting in person in the service area (${lang})`, () => {
      const step = T[lang].process.steps[0].desc;
      expect(step).toContain(IN_PERSON[lang]);
      expect(namesArea(lang, step)).toBe(true);
    });
  }

  it('offers the first meeting in person in the service area on the craftsmen page', () => {
    const steps = de.servicePages['website-fuer-handwerker'].sections?.find(s => s.ordered)?.list ?? [];
    expect(steps[0]).toContain('persönlich');
    expect(namesArea('de', steps[0])).toBe(true);
  });
});
