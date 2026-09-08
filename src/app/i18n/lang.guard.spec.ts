import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { langGuard } from './lang.guard';
import { LangService } from '../services/lang.service';
import { blogArticleUrlPath } from './route-map';

/** The guard only reads route.data, so a plain data bag is enough. */
const snapshotWith = (data: Record<string, unknown>) => ({ data }) as unknown as ActivatedRouteSnapshot;

describe('langGuard', () => {
  let lang: LangService;
  let document: Document;

  // CanActivateFn allows an async result; this guard is deliberately synchronous.
  const run = (data: Record<string, unknown>): boolean =>
    runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      langGuard(snapshotWith(data), {} as RouterStateSnapshot),
    ) as boolean;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    lang = TestBed.inject(LangService);
    document = TestBed.inject(DOCUMENT);

    const manifest = document.createElement('link');
    manifest.setAttribute('rel', 'manifest');
    document.head.appendChild(manifest);
  });

  afterEach(() => {
    document.head.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
    localStorage.clear();
  });

  it('lets the navigation through', () => {
    expect(run({ lang: 'de', pageKey: 'home' })).toBe(true);
  });

  it('applies the locale of the route before the page is constructed', () => {
    run({ lang: 'en', pageKey: 'home' });

    expect(lang.current()).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('lets the URL win over a stored preference', () => {
    localStorage.setItem('lang', 'tr');

    run({ lang: 'en', pageKey: 'home' });

    expect(lang.current()).toBe('en');
  });

  it('passes the article id on; without an English translation the switch falls back to the English home', () => {
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    run({ lang: 'de', pageKey: 'blog', articleId: 'website-kosten-handwerker' });

    lang.switchTo('en');

    expect(blogArticleUrlPath('website-kosten-handwerker', 'en')).toBeUndefined();
    expect(navigateByUrl).toHaveBeenCalledWith('/en');
  });

  it('works without an article id on ordinary pages', () => {
    run({ lang: 'de', pageKey: 'privacy' });

    expect(lang.current()).toBe('de');
    expect(lang.pagePath('privacy')).toBe('/privacy-policy');
  });
});
