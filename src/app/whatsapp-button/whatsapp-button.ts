import { Component, computed, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { SITE_CONFIG } from '../config/site.config';

/**
 * Floating WhatsApp contact button. Hidden while SITE_CONFIG.whatsappNumber
 * is empty — add a WhatsApp Business number there to activate it.
 */
@Component({
  selector: 'app-whatsapp-button',
  imports: [],
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
})
export class WhatsappButton {
  lang = inject(LangService);

  readonly number = SITE_CONFIG.whatsappNumber;

  href = computed(() =>
    `https://wa.me/${this.number}?text=${encodeURIComponent(this.lang.t().whatsapp.prefill)}`,
  );
}
