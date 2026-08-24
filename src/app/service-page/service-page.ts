import { Component, inject, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { InquiryService } from '../services/inquiry.service';
import { urlPathsFor, PageKey } from '../i18n/route-map';

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
})
export class ServicePage {
  lang = inject(LangService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  private inquiry = inject(InquiryService);

  slug = this.route.snapshot.data['slug'] as string;

  content = () => this.lang.t().servicePages[this.slug];

  constructor() {
    effect(() => {
      const page = this.content();
      this.seo.update({
        title: page.metaTitle,
        description: page.metaDescription,
        lang: this.lang.current(),
        paths: urlPathsFor(this.slug as PageKey),
      });
    });
  }

  prefillContact() {
    this.inquiry.projectType.set(PROJECT_TYPE_BY_SLUG[this.slug] ?? '');
  }
}
