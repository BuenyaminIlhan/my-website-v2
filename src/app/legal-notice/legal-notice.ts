import { Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { urlPathsFor } from '../i18n/route-map';

@Component({
  selector: 'app-legal-notice',
  imports: [RouterLink],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  lang = inject(LangService);
  private seo = inject(SeoService);

  constructor() {
    effect(() => {
      const t = this.lang.t();
      this.seo.update({
        title: t.meta.legalTitle,
        description: t.meta.legalDesc,
        lang: this.lang.current(),
        paths: urlPathsFor('legal'),
      });
    });
  }
}
