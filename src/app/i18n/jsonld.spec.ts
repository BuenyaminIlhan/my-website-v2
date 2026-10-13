import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { buildServicePageGraph, buildSiteGraph, e164 } from './jsonld';
import { homePathFor } from './route-map';
import { de } from './de';
import { en } from './en';
import { Lang, LangTranslations } from './translations';
import { SeoService } from '../services/seo.service';
import { SITE_CONFIG } from '../config/site.config';

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

  for (const lang of ['de', 'en'] as Lang[]) {
    it(`names the ${lang} home page in the form the server serves`, () => {
      const url = nodeOf(buildSiteGraph(lang, T[lang]), 'ProfilePage')['url'];

      expect(url).toBe(lang === 'de' ? `${BASE}/` : `${BASE}/en/`);
    });
  }

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

  it('names the business exactly like its Business Profile, in every language', () => {
    for (const [lang, t] of [['de', de], ['en', en]] as [Lang, LangTranslations][]) {
      expect(nodeOf(buildSiteGraph(lang, t), 'ProfessionalService')['name']).toBe('Softlyx');
    }
    expect(nodeOf(buildSiteGraph('de', de), 'Person')['name']).toBe('Bünyamin Ilhan');
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

  it('keeps the street out of the person node', () => {
    const person = nodeOf(buildSiteGraph('de', de), 'Person') as unknown as {
      address: Record<string, string>;
    };

    expect(person.address['addressLocality']).toBe('Siegburg');
    expect(person.address['streetAddress']).toBeUndefined();
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

    expect(nodeOf(buildSiteGraph('en', en), 'ProfilePage')['url']).toBe(canonicalHref);
  });
});
