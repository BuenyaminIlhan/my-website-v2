import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../services/lang.service';
import { InquiryService } from '../services/inquiry.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';

@Component({
  selector: 'app-offerings',
  imports: [RevealDirective, RouterLink],
  templateUrl: './offerings.html',
  styleUrl: './offerings.scss',
})
export class Offerings {
  lang = inject(LangService);
  inquiry = inject(InquiryService);
}
