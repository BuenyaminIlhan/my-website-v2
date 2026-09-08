import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { LangService } from './lang.service';

describe('LangService', () => {
  let service: LangService;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let document: Document;

  beforeEach(() => {
    navigateByUrl = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigateByUrl } }],
    });
    service = TestBed.inject(LangService);
    document = TestBed.inject(DOCUMENT);
    localStorage.clear();
    // index.html ships a manifest link on every prerendered route.
    const manifest = document.createElement('link');
    manifest.setAttribute('rel', 'manifest');
    manifest.setAttribute('href', 'manifest.json');
    document.head.appendChild(manifest);
  });

  afterEach(() => {
    document.head.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
  });

  const manifestHref = () =>
    document.head.querySelector('link[rel="manifest"]')?.getAttribute('href');

  describe('applyRoute', () => {
    it('takes the language from the route and reflects it on <html lang>', () => {
      service.applyRoute('en', 'home');

      expect(service.current()).toBe('en');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    it('serves exactly German and English — Turkish moved to its own domain', () => {
      expect(service.locales).toEqual(['de', 'en']);
    });

    it('points each locale at its own web app manifest', () => {
      service.applyRoute('en', 'home');
      expect(manifestHref()).toBe('manifest.en.json');

      service.applyRoute('de', 'home');
      expect(manifestHref()).toBe('manifest.json');
    });

    it('swaps the translation bundle the rest of the app reads', () => {
      service.applyRoute('de', 'home');
      expect(service.t().nav.contact).toBe('Kontakt');

      service.applyRoute('en', 'home');
      expect(service.t().nav.contact).toBe('Contact');
    });
  });

  describe('link', () => {
    it('leaves German links unprefixed', () => {
      service.applyRoute('de', 'home');

      expect(service.link('/')).toBe('/');
      expect(service.link('/blog')).toBe('/blog');
    });

    it('prefixes other locales without leaving a trailing slash on the root', () => {
      service.applyRoute('en', 'home');

      expect(service.link('/')).toBe('/en');
      expect(service.link('/blog')).toBe('/en/blog');
    });
  });

  describe('pagePath', () => {
    it('resolves a page key to the localized path of the active locale', () => {
      service.applyRoute('en', 'home');

      expect(service.pagePath('legal')).toBe('/en/legal-notice');
    });

    it('falls back to the locale home when the page key is unknown', () => {
      service.applyRoute('en', 'home');

      expect(service.pagePath('no-such-page')).toBe('/en');
    });
  });

  describe('switchTo', () => {
    it('navigates to the same page in the target locale', () => {
      service.applyRoute('de', 'website-erstellen-lassen');

      service.switchTo('en');

      expect(navigateByUrl).toHaveBeenCalledWith('/en/website-development');
    });

    it('leaves a blog article for the English home — no article has an English counterpart', () => {
      service.applyRoute('de', 'blog', 'website-kosten-handwerker');

      service.switchTo('en');

      expect(navigateByUrl).toHaveBeenCalledWith('/en');
    });

    it('falls back to the locale home when the page has no counterpart there', () => {
      // The blog does not exist in English — do not 404 the visitor.
      service.applyRoute('de', 'blog');

      service.switchTo('en');

      expect(navigateByUrl).toHaveBeenCalledWith('/en');
    });

    it('remembers the chosen language for the next visit', () => {
      service.applyRoute('de', 'home');

      service.switchTo('en');

      expect(localStorage.getItem('lang')).toBe('en');
    });

    it('does nothing when the target locale is already active', () => {
      service.applyRoute('de', 'home');

      service.switchTo('de');

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(localStorage.getItem('lang')).toBeNull();
    });
  });
});
