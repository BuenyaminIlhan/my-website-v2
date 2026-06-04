import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-me',
  imports: [RevealDirective],
  templateUrl: './about-me.html',
  styleUrl: './about-me.scss',
})
export class AboutMe {
  lang = inject(LangService);
}
