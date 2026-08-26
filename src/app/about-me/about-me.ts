import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-me',
  imports: [RevealDirective],
  templateUrl: './about-me.html',
  styleUrl: './about-me.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMe {
  lang = inject(LangService);
}
