import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  readonly isDark = signal<boolean>(false);

  /** True when the start theme came from the system query, not from a stored choice. */
  readonly followedSystem = signal<boolean>(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem('theme');
    const canQuery = typeof matchMedia === 'function';
    /* A visitor who has chosen keeps their choice; everyone else gets what
       their system asks for instead of always landing on light. */
    const dark = saved ? saved === 'dark' : canQuery && matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDark.set(dark);
    this.followedSystem.set(!saved && canQuery);
    this.document.body.classList.toggle('light', !dark);
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    this.followedSystem.set(false);

    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.toggle('light', !next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
  }
}
