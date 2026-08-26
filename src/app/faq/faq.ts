import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-faq',
  imports: [RevealDirective],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  lang = inject(LangService);
}
