import { ChangeDetectionStrategy, Component, signal, HostListener, inject, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { LangService } from '../services/lang.service';
import { WhatsappService } from '../services/whatsapp.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private router = inject(Router);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  theme = inject(ThemeService);
  lang = inject(LangService);
  whatsapp = inject(WhatsappService);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 50);
  }

  /* Escape closes the overlay and hands the focus back to the button that
     opened it — otherwise a keyboard visitor lands nowhere. It stays silent
     while the menu is closed, so it never swallows anyone else's Escape. */
  @HostListener('document:keydown.escape')
  onEscape() {
    if (!this.menuOpen()) return;

    this.closeMenu();
    this.el.nativeElement.querySelector<HTMLButtonElement>('.burger')?.focus();
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
