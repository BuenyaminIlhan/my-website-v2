import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-process',
  imports: [RevealDirective],
  templateUrl: './process.html',
  styleUrl: './process.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Process {
  lang = inject(LangService);
}
