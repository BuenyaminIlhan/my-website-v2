import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        this.isDark.set(true);
        this.document.body.classList.remove('light');
      } else {
        this.document.body.classList.add('light');
      }
    }
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.toggle('light', !next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
  }
}
