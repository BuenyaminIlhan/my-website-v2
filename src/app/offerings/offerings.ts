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

  prefill(slug: string) {
    this.inquiry.projectType.set(PROJECT_TYPE_BY_SLUG[slug] ?? '');
  }
}
