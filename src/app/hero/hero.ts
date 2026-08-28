import { ChangeDetectionStrategy, Component, signal, effect, inject, PLATFORM_ID, OnDestroy, ElementRef, NgZone, DestroyRef, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';
import { WhatsappService } from '../services/whatsapp.service';
import { Marquee } from '../marquee/marquee';
import { TerminalPanel } from '../terminal-panel/terminal-panel';

@Component({
  selector: 'app-hero',
  imports: [Marquee, TerminalPanel],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements OnDestroy {
  lang = inject(LangService);
  whatsapp = inject(WhatsappService);
  private platformId = inject(PLATFORM_ID);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  readonly displayed = signal('');
  readonly cursorVisible = signal(true);

  private typeTimer?: ReturnType<typeof setInterval>;
  private cursorTimer?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const text = this.lang.t().hero.sub;
      if (isPlatformBrowser(this.platformId)) {
        this.startTyping(text);
      } else {
        this.displayed.set(text);
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.cursorTimer = setInterval(() => {
        this.cursorVisible.update(v => !v);
      }, 530);

      afterNextRender(() => this.bindCtaSpotlight());
    }
  }

  /* Spotlight follows the cursor across the primary CTA. Bound outside
     Angular: it only writes two CSS custom properties, so a change
     detection run per mouse move would be pure waste. */
  private bindCtaSpotlight() {
    const btn = this.el.nativeElement.querySelector<HTMLElement>('.btn-primary');
    if (!btn) return;

    this.zone.runOutsideAngular(() => {
      const move = (event: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        btn.style.setProperty('--my', `${event.clientY - rect.top}px`);
      };
      btn.addEventListener('mousemove', move);
      this.destroyRef.onDestroy(() => btn.removeEventListener('mousemove', move));
    });
  }

  private startTyping(text: string) {
    clearInterval(this.typeTimer);
    this.displayed.set('');
    let i = 0;
    this.typeTimer = setInterval(() => {
      this.displayed.set(text.slice(0, ++i));
      if (i >= text.length) clearInterval(this.typeTimer);
    }, 22);
  }

  ngOnDestroy() {
    clearInterval(this.typeTimer);
    clearInterval(this.cursorTimer);
  }
}
