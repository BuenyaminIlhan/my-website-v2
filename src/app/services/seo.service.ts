import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Lang } from '../i18n/translations';
import { SITE_CONFIG } from '../config/site.config';

const OG_LOCALES: Record<Lang, string> = { de: 'de_DE', en: 'en_US', tr: 'tr_TR' };

export interface SeoPageInfo {
  title: string;
  description: string;
  /** Language of the current page — drives og:locale and hreflang bookkeeping. */
  lang: Lang;
  /**
   * URL path per locale (relative to the site root, no leading slash; '' = root),
   * only for locales where the page exists. Drives canonical + hreflang alternates.
   */
  paths: Partial<Record<Lang, string>>;
  ogImage?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  private readonly baseUrl = SITE_CONFIG.baseUrl;
  private readonly defaultImage = SITE_CONFIG.baseUrl + '/assets/img/og-image.jpg';

  private urlOf(path: string): string {
    return path ? `${this.baseUrl}/${path}` : `${this.baseUrl}/`;
  }

  update(info: SeoPageInfo) {
    const currentPath = info.paths[info.lang] ?? '';
    const url = this.urlOf(currentPath);
    const image = info.ogImage ?? this.defaultImage;

    this.title.setTitle(info.title);
    this.meta.updateTag({ name: 'description', content: info.description });
    this.meta.updateTag({ property: 'og:title', content: info.title });
    this.meta.updateTag({ property: 'og:description', content: info.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: OG_LOCALES[info.lang] });
    this.meta.updateTag({ name: 'twitter:title', content: info.title });
    this.meta.updateTag({ name: 'twitter:description', content: info.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // og:locale:alternate — replace the whole set, Meta.updateTag can't handle multiples.
    this.document.head
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach(el => el.remove());
    for (const [lang] of this.entries(info.paths)) {
      if (lang === info.lang) continue;
      this.meta.addTag({ property: 'og:locale:alternate', content: OG_LOCALES[lang] });
    }

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    this.setHreflang(info.paths);
  }

  private setHreflang(paths: Partial<Record<Lang, string>>) {
    this.document.head
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach(el => el.remove());
    const add = (hreflang: string, path: string) => {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', this.urlOf(path));
      this.document.head.appendChild(link);
    };
    for (const [lang, path] of this.entries(paths)) add(lang, path);
    // x-default points to the German original.
    if (paths.de !== undefined) add('x-default', paths.de);
  }

  private entries(paths: Partial<Record<Lang, string>>): [Lang, string][] {
    return Object.entries(paths) as [Lang, string][];
  }

  /** Injects page-specific JSON-LD (e.g. BlogPosting). One slot: a new call replaces the previous script. */
  setJsonLd(data: object) {
    this.clearJsonLd();
    const script = this.document.createElement('script');
    script.id = 'page-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  clearJsonLd() {
    this.document.getElementById('page-jsonld')?.remove();
  }
}
