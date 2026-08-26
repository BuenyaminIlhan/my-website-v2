import { ChangeDetectionStrategy, Component, signal, HostListener, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LangService } from '../services/lang.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private router = inject(Router);
  theme = inject(ThemeService);
  lang = inject(LangService);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 50);
  }

  navigateTo(fragment: string) {
    void this.router.navigate([this.lang.link('/')], { fragment });
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
