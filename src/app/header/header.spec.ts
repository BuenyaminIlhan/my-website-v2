import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Header } from './header';
import { LangService } from '../services/lang.service';
import { host, text } from '../../testing/fixture';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let header: Header;
  let navigate: MockInstance<Router['navigate']>;
  let bodyWasLight: boolean;

  beforeEach(() => {
    // ThemeService paints the body on creation; remember what to put back.
    bodyWasLight = document.body.classList.contains('light');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    // The real Router keeps routerLink in the template working; only the
    // navigation itself is stubbed out.
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Header);
    header = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    /* toggle() stores the choice and repaints the body. Both outlive the
       fixture, so they are restored here and not at the end of a test body,
       where a failing expect() would skip the cleanup. */
    localStorage.removeItem('theme');
    document.body.classList.toggle('light', bodyWasLight);
  });

  it('renders the localized navigation', () => {
    const lang = TestBed.inject(LangService);
    expect(text(fixture)).toContain(lang.t().nav.contact);
  });

  it('offers WhatsApp in the menu, with the shared link', () => {
    const el: HTMLElement = fixture.nativeElement;
    const menuEntry = el.querySelector('.nav-links .nav-wa');

    expect(menuEntry?.getAttribute('href')).toBe(header.whatsapp.href());
    expect(menuEntry?.textContent).toContain(header.lang.t().whatsapp.cta);
    expect(menuEntry?.getAttribute('rel')).toContain('noopener');
    // The dense control row has no space for a fourth control.
    expect(el.querySelector('.header-wa')).toBeNull();
  });

  it('keeps the closed menu out of the tab order', () => {
    const el: HTMLElement = fixture.nativeElement;
    const overlay = el.querySelector('.nav-overlay');

    expect(header.menuOpen()).toBe(false);
    expect(overlay?.hasAttribute('inert')).toBe(true);

    header.toggleMenu();
    fixture.detectChanges();

    expect(overlay?.hasAttribute('inert')).toBe(false);
  });

  it('brands the logo as Softlyx while keeping the person for assistive tech', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.logo .logo-word')?.textContent).toBe('softlyx_');
    expect(el.querySelector('.logo .logo-mark')).not.toBeNull();
    expect(el.querySelector('.logo .sr-only')?.textContent).toBe('Softlyx – Bünyamin Ilhan');
  });

  it('opens and closes the mobile menu', () => {
    expect(header.menuOpen()).toBe(false);

    header.toggleMenu();
    expect(header.menuOpen()).toBe(true);

    header.toggleMenu();
    expect(header.menuOpen()).toBe(false);
  });

  it('navigates to a section on the locale home and closes the menu', () => {
    header.toggleMenu();

    header.navigateTo('kontakt');

    expect(navigate).toHaveBeenCalledWith([header.lang.link('/')], { fragment: 'kontakt' });
    expect(header.menuOpen()).toBe(false);
  });

  it('marks itself scrolled past 50px', () => {
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    header.onScroll();
    expect(header.scrolled()).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    header.onScroll();
    expect(header.scrolled()).toBe(true);
  });

  it('scrollToTop scrolls the window and closes the menu', () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, configurable: true });
    header.toggleMenu();

    header.scrollToTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(header.menuOpen()).toBe(false);
  });

  it('labels the theme toggle from the translations, in both directions', () => {
    const label = () => host(fixture).querySelector('.theme-btn')?.getAttribute('aria-label');
    const a11y = () => header.lang.t().a11y;
    const wasDark = header.theme.isDark();

    expect(label()).toBe(wasDark ? a11y().switchToLight : a11y().switchToDark);

    header.theme.toggle();
    fixture.detectChanges();

    expect(header.theme.isDark()).toBe(!wasDark);
    expect(label()).toBe(wasDark ? a11y().switchToDark : a11y().switchToLight);
  });

  it('names the theme button by the action it performs, in both languages', () => {
    const lang = TestBed.inject(LangService);
    const label = () => host(fixture).querySelector('.theme-btn')?.getAttribute('aria-label') ?? '';
    // The signal is set directly: this is about the wording, not about the
    // persistence that toggle() would drag in.
    const show = (dark: boolean) => { header.theme.isDark.set(dark); fixture.detectChanges(); };

    expect(lang.current()).toBe('de');
    show(false);
    expect(label()).toBe('Zu dunklem Theme wechseln');
    show(true);
    expect(label()).toBe('Zu hellem Theme wechseln');

    lang.current.set('en');
    fixture.detectChanges();
    expect(label()).toBe('Switch to light mode');
    show(false);
    expect(label()).toBe('Switch to dark mode');
  });

  it('names both the action and its target, in every locale', () => {
    const lang = TestBed.inject(LangService);
    const label = () => host(fixture).querySelector('.theme-btn')?.getAttribute('aria-label') ?? '';
    /* A bare state noun ("Dunkles Theme") leaves listeners guessing whether it
       names the current theme or the one behind the button, and a verb alone
       ("Theme wechseln") is just as mute about the target. */
    const both = (phrase: RegExp) => {
      header.theme.isDark.set(false);
      fixture.detectChanges();
      const whileLight = label();

      header.theme.isDark.set(true);
      fixture.detectChanges();
      const whileDark = label();

      expect(whileLight).toMatch(phrase);
      expect(whileDark).toMatch(phrase);
      expect(whileLight).not.toBe(whileDark);
    };

    both(/^Zu (hellem|dunklem) Theme wechseln$/);

    lang.current.set('en');
    both(/^Switch to (light|dark) mode$/);

    // Turkish still ships from here; this case leaves with tr.ts when the
    // decoupling branch lands.
    lang.current.set('tr');
    both(/^(Açık|Koyu) temaya geçin$/);
  });
});
