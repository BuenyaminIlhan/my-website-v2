import { Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';
import { ContactWizard } from '../contact-wizard/contact-wizard';

@Component({
  selector: 'app-contact',
  imports: [RevealDirective, ContactWizard],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  lang = inject(LangService);
}
