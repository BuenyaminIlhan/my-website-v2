import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { urlPathsFor } from '../i18n/route-map';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  lang = inject(LangService);
  private seo = inject(SeoService);

  constructor() {
    effect(() => {
      const t = this.lang.t();
      this.seo.update({
        title: t.meta.privacyTitle,
        description: t.meta.privacyDesc,
        lang: this.lang.current(),
        paths: urlPathsFor('privacy'),
      });
    });
  }
}
