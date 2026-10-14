import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ServicePage } from './service-page';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { text } from '../../testing/fixture';
import { SITE_CONFIG } from '../config/site.config';

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
});
