import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private router = inject(Router);
  theme = inject(ThemeService);
  lang = inject(LangService);

  menuOpen = signal(false);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 50);
  }

  navigateTo(fragment: string) {
    this.router.navigate(['/'], { fragment });
    this.closeMenu();
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.closeMenu();
  }
}
