import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';
import { SITE_CONFIG } from '../config/site.config';

/**
 * Invitation to leave a Google review. Hidden while SITE_CONFIG.googleReviewUrl
 * is empty — add the Google Business profile review link there to activate it.
 *
 * There are no reviews yet, so the section says exactly that: no stars, no
 * rating, no count, no quotes. Anything else would be fabricated social proof.
 *
 * `url` is a signal rather than a plain const so specs can render the visible
 * state without mutating the frozen SITE_CONFIG.
 */
@Component({
  selector: 'app-reviews',
  imports: [RevealDirective],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reviews {
  lang = inject(LangService);

  readonly url = signal<string>(SITE_CONFIG.googleReviewUrl);
}
