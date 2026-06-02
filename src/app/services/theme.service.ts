import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      this.isDark.set(false);
      document.body.classList.add('light');
    }
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    document.body.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }
}
