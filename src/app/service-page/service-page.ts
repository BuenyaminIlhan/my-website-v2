import { ChangeDetectionStrategy, Component, inject, effect, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { InquiryService } from '../services/inquiry.service';
import { urlPathsFor, PageKey, blogArticleUrlPath } from '../i18n/route-map';
import { ContentLink, ProjectTypeKey, ServicePageContent } from '../i18n/translations';
import { buildServicePageGraph } from '../i18n/jsonld';

/** Maps service content keys to the wizard's project-type keys for prefilling. */
const PROJECT_TYPE_BY_SLUG: Record<string, ProjectTypeKey> = {
  'website-erstellen-lassen': 'website',
  'web-app-entwicklung': 'webApp',
  'website-optimierung': 'optimization',
  'sorglos-paket': 'maintenance',
  'website-fuer-handwerker': 'website',
};

@Component({
  selector: 'app-service-page',
  imports: [RouterLink],
  templateUrl: './service-page.html',
  styleUrl: './service-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicePage implements OnDestroy {
  lang = inject(LangService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  private inquiry = inject(InquiryService);

  slug = this.route.snapshot.data['slug'] as string;

  /** Undefined where the locale has no such page — the craftsmen page exists in German only. */
  content = (): ServicePageContent | undefined => this.lang.t().servicePages[this.slug];

  constructor() {
    effect(() => {
      const page = this.content();
      const lang = this.lang.current();
      // A page that exists in some locales only (the craftsmen page) has no content in
      // the others. The language switch applies the new locale while this page is still
      // mounted; the head must then stay as it is until the next page writes its own.
      if (page === undefined) return;
      this.seo.update({
        title: page.metaTitle,
        description: page.metaDescription,
        lang,
        paths: urlPathsFor(this.slug as PageKey),
      });
      this.seo.setJsonLd(buildServicePageGraph(lang, this.slug as PageKey, page));
    });
  }

  ngOnDestroy() {
    this.seo.clearJsonLd();
  }

  /** In-app address of a content link: a page of routes.json or a blog article. */
  linkPath(link: ContentLink): string {
    if (link.page !== undefined) return this.lang.pagePath(link.page);
    const article = blogArticleUrlPath(link.article, this.lang.current());
    // An article without a version in this locale falls back to the blog index — or to
    // the home page where the locale has no blog at all (English).
    return article === undefined ? this.lang.pagePath('blog') : '/' + article;
  }

  prefillContact() {
    this.inquiry.projectType.set(PROJECT_TYPE_BY_SLUG[this.slug] ?? '');
  }
}
