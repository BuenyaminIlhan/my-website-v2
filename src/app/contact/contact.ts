import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { WhatsappService } from '../services/whatsapp.service';
import { RevealDirective } from '../directives/scroll-reveal.directive';
import { ContactWizard } from '../contact-wizard/contact-wizard';

@Component({
  selector: 'app-contact',
  imports: [RevealDirective, ContactWizard],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  lang = inject(LangService);
  private whatsapp = inject(WhatsappService);

  readonly hasWhatsapp = this.whatsapp.available;
  readonly waHref = this.whatsapp.href;
}
