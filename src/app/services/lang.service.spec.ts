import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  });

  describe('applyRoute', () => {
    it('takes the language from the route and reflects it on <html lang>', () => {
      service.applyRoute('tr', 'home');

      expect(service.current()).toBe('tr');
      expect(document.documentElement.getAttribute('lang')).toBe('tr');
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
      service.applyRoute('tr', 'home');

      expect(service.link('/')).toBe('/tr');
      expect(service.link('/blog')).toBe('/tr/blog');
    });
  });

  describe('pagePath', () => {
    it('resolves a page key to the localized path of the active locale', () => {
      service.applyRoute('tr', 'home');

      expect(service.pagePath('legal')).toBe('/tr/kunye');
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

    it('keeps the visitor on the same blog article across locales', () => {
      service.applyRoute('de', 'blog', 'website-kosten-handwerker');

      service.switchTo('tr');

      expect(navigateByUrl).toHaveBeenCalledWith('/tr/blog/esnaf-icin-web-sitesi-maliyeti');
    });

    it('falls back to the locale home when the page has no counterpart there', () => {
      // The blog does not exist in English — do not 404 the visitor.
      service.applyRoute('de', 'blog');

      service.switchTo('en');

      expect(navigateByUrl).toHaveBeenCalledWith('/en');
    });

    it('remembers the chosen language for the next visit', () => {
      service.applyRoute('de', 'home');

      service.switchTo('tr');

      expect(localStorage.getItem('lang')).toBe('tr');
    });

    it('does nothing when the target locale is already active', () => {
      service.applyRoute('de', 'home');

      service.switchTo('de');

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(localStorage.getItem('lang')).toBeNull();
    });
  });
});
