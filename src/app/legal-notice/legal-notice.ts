import { Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

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
      const isDE = this.lang.current() === 'de';
      this.seo.update(
        isDE ? 'Impressum — Bünyamin Ilhan' : 'Legal Notice — Bünyamin Ilhan',
        isDE
          ? 'Impressum von Bünyamin Ilhan, Web- und Mobile-Entwickler aus Siegburg.'
          : 'Legal notice of Bünyamin Ilhan, Web & Mobile Developer based in Siegburg.',
        'legal-notice',
      );
    });
  }
}
