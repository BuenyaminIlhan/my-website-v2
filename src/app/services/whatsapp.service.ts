import { Injectable, computed, inject } from '@angular/core';
import { LangService } from './lang.service';
import { SITE_CONFIG } from '../config/site.config';

/**
 * The single source for the WhatsApp deep link. Four places offer the
 * channel (hero button, mobile menu, floating button, contact card) and
 * they must agree on number, prefilled message and encoding.
 *
 * `available` is false while SITE_CONFIG.whatsappNumber is empty — every
 * WhatsApp affordance on the site hangs off it.
 */
@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private lang = inject(LangService);

  readonly available = SITE_CONFIG.whatsappNumber.length > 0;

  readonly href = computed(() =>
    `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(this.lang.t().whatsapp.prefill)}`,
  );
}
