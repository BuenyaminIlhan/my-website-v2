import { Component, signal, computed, effect, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnDestroy {
  lang = inject(LangService);
  private platformId = inject(PLATFORM_ID);

  displayed = signal('');
  cursorVisible = signal(true);

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
    }
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
