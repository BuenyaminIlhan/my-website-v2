import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Header } from './header';
import { LangService } from '../services/lang.service';
import { text } from '../../testing/fixture';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let header: Header;
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    // The real Router keeps routerLink in the template working; only the
    // navigation itself is stubbed out.
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Header);
    header = fixture.componentInstance;
    fixture.detectChanges();
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
});
