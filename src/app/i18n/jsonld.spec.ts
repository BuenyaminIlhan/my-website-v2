import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { buildSiteGraph } from './jsonld';
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
