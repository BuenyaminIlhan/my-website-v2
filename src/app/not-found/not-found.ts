import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { SeoService } from '../services/seo.service';
import { urlPathsFor } from '../i18n/route-map';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  lang = inject(LangService);
  private seo = inject(SeoService);

  constructor() {
    effect(() => {
      const t = this.lang.t();
      this.seo.update({
        title: t.meta.notFoundTitle,
        description: t.meta.notFoundDesc,
        lang: this.lang.current(),
        paths: urlPathsFor('notFound'),
      });
    });
  }
}
