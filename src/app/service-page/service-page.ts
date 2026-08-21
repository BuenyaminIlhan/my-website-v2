import { Component, inject, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { InquiryService } from '../services/inquiry.service';

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
      this.seo.update(page.metaTitle, page.metaDescription, this.slug);
    });
  }

  prefillContact() {
    const title = this.lang.t().offers.items.find(item => item.slug === this.slug)?.title;
    if (title) this.inquiry.projectType.set(title);
  }
}
