import { ChangeDetectionStrategy, Component, signal, inject, PLATFORM_ID, DestroyRef, NgZone, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';
import { WhatsappService } from '../services/whatsapp.service';

/**
 * Floating WhatsApp button. Starts as a labelled pill so the channel is
 * unmissable, then collapses to a circle once the visitor has scrolled
 * past the first screen and no longer needs the introduction.
 *
 * Hidden entirely while SITE_CONFIG.whatsappNumber is empty.
 */
@Component({
  selector: 'app-whatsapp-button',
  imports: [],
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappButton {
  lang = inject(LangService);
  private wa = inject(WhatsappService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  readonly available = this.wa.available;
  readonly href = this.wa.href;
  readonly collapsed = signal(false);

  constructor() {
    if (!this.available || !isPlatformBrowser(this.platformId)) return;
    afterNextRender(() => this.trackScroll());
  }

  /* Listener sits outside Angular — it fires on every scroll frame and only
     ever flips one boolean, so it enters the zone just for that change. */
  private trackScroll(): void {
    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        const past = window.scrollY > window.innerHeight * 0.9;
        if (past !== this.collapsed()) {
          this.zone.run(() => this.collapsed.set(past));
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
      onScroll();
    });
  }
}
