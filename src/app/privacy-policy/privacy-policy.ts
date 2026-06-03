import { Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  lang = inject(LangService);
  private seo = inject(SeoService);

  constructor() {
    effect(() => {
      const isDE = this.lang.current() === 'de';
      this.seo.update(
        isDE ? 'Datenschutz — Bünyamin Ilhan' : 'Privacy Policy — Bünyamin Ilhan',
        isDE
          ? 'Datenschutzerklärung von Bünyamin Ilhan gemäß DSGVO.'
          : 'Privacy policy of Bünyamin Ilhan in accordance with GDPR.',
        'privacy-policy',
      );
    });
  }
}
