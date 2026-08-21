import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);

  private readonly baseUrl = 'https://ilhan-buenyamin.com';
  private readonly defaultImage = 'https://ilhan-buenyamin.com/assets/img/og-image.jpg';

  update(pageTitle: string, description: string, path = '', ogImage?: string) {
    const url = path ? `${this.baseUrl}/${path}` : this.baseUrl;
    const image = ogImage ?? this.defaultImage;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
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
