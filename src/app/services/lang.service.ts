import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Lang, LangTranslations, SUPPORTED_LOCALES } from '../i18n/translations';
import { de } from '../i18n/de';
import { en } from '../i18n/en';
import { PageKey, urlPathFor, homePathFor, blogArticleUrlPath } from '../i18n/route-map';

export type { Lang, LangTranslations, OfferItem, ServicePageContent, TestimonialItem } from '../i18n/translations';

const translations: Record<Lang, LangTranslations> = { de, en };

/** Where the visitor currently is, in locale-independent terms — set by the langGuard. */
interface RouteContext {
  pageKey: PageKey;
  articleId?: string;
}

@Injectable({ providedIn: 'root' })
export class LangService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private router = inject(Router);

  readonly locales = SUPPORTED_LOCALES;
  readonly current = signal<Lang>('de');
  readonly t = computed<LangTranslations>(() => translations[this.current()]);

  private readonly routeCtx = signal<RouteContext | null>(null);

  /** Called by the langGuard on every navigation. The URL is the source of truth for the language. */
  applyRoute(lang: Lang, pageKey: PageKey, articleId?: string) {
    this.routeCtx.set({ pageKey, articleId });
    if (this.current() !== lang) this.current.set(lang);
    // Imperative so the prerendered HTML of every locale carries the right <html lang>.
    this.document.documentElement.setAttribute('lang', lang);
    this.setManifest(lang);
  }

  /**
   * index.html ships the German manifest for every prerendered route; point each
   * locale at its own so an installed PWA gets the right name and start URL.
   */
  private setManifest(lang: Lang) {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    link?.setAttribute('href', lang === 'de' ? 'manifest.json' : `manifest.${lang}.json`);
  }

  /** Prefixes an absolute in-app link ('/blog', '/') with the current locale ('' for de). */
  link(path: string): string {
    const lang = this.current();
    if (lang === 'de') return path;
    return path === '/' ? `/${lang}` : `/${lang}${path}`;
  }

  /** Localized URL of a service/legal/blog page for the current locale. */
  pagePath(key: string): string {
    const p = urlPathFor(key as PageKey, this.current()) ?? homePathFor(this.current());
    return '/' + p;
  }

  /** Navigates to the equivalent page in another locale (falls back to that locale's home). */
  switchTo(target: Lang) {
    if (target === this.current()) return;
    const ctx = this.routeCtx();
    let path: string | undefined;
    if (ctx?.articleId) path = blogArticleUrlPath(ctx.articleId, target);
    else if (ctx) path = urlPathFor(ctx.pageKey, target);
    if (path === undefined) path = homePathFor(target);
    void this.router.navigateByUrl('/' + path);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', target);
    }
  }
}
