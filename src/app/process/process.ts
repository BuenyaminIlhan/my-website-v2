import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-process',
  imports: [RevealDirective],
  templateUrl: './process.html',
  styleUrl: './process.scss',
})
export class Process {
  lang = inject(LangService);
}
