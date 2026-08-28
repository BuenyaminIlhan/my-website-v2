import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

/** Maps offer content keys to the inquiry wizard's project-type keys. */
const PROJECT_TYPE_BY_SLUG: Record<string, string> = {
  'website-erstellen-lassen': 'website',
  'web-app-entwicklung': 'webApp',
  'website-optimierung': 'optimization',
  'sorglos-paket': 'maintenance',
};

@Component({
  selector: 'app-offerings',
  imports: [RevealDirective, RouterLink],
  templateUrl: './offerings.html',
  styleUrl: './offerings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Offerings {
  lang = inject(LangService);
  inquiry = inject(InquiryService);

  /* Bento positions are chosen by slug, not by index: the locales are
     free to reorder or add offers without silently moving the big tile
     onto the wrong service. */
  isCore(slug: string): boolean {
    return slug === 'web-app-entwicklung';
  }

  isBand(slug: string): boolean {
    return slug === 'sorglos-paket';
  }

  prefill(slug: string) {
    this.inquiry.projectType.set(PROJECT_TYPE_BY_SLUG[slug] ?? '');
  }
}
