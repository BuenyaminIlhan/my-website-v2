import { ChangeDetectionStrategy, Component, inject, effect, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { InquiryService } from '../services/inquiry.service';
import { urlPathsFor, PageKey } from '../i18n/route-map';
import { buildServicePageGraph } from '../i18n/jsonld';

/** Maps service content keys to the wizard's project-type keys for prefilling. */
const PROJECT_TYPE_BY_SLUG: Record<string, string> = {
  'website-erstellen-lassen': 'website',
  'web-app-entwicklung': 'webApp',
  'website-optimierung': 'optimization',
  'sorglos-paket': 'maintenance',
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

  content = () => this.lang.t().servicePages[this.slug];

  constructor() {
    effect(() => {
      const page = this.content();
      const lang = this.lang.current();
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

  prefillContact() {
    this.inquiry.projectType.set(PROJECT_TYPE_BY_SLUG[this.slug] ?? '');
  }
}
