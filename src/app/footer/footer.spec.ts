import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';
import { text } from '../../testing/fixture';
import { SITE_CONFIG } from '../config/site.config';
import { namesOwner } from '../../testing/owner-name';

/** The FAB handlers only read these fields off the event. */
const pointerEvent = (clientX: number, clientY: number): PointerEvent =>
  ({
    clientX,
    clientY,
    pointerId: 1,
    preventDefault: () => undefined,
    target: { setPointerCapture: () => undefined },
  }) as unknown as PointerEvent;

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let footer: Footer;
  let scrollTo: ReturnType<typeof vi.fn>;

  const create = () => {
    fixture = TestBed.createComponent(Footer);
    footer = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.clear());

  it('renders the localized footer', () => {
    create();
    expect(text(fixture)).toContain(String(footer.year));
  });

  it('brands the footer logo as Softlyx with one clean accessible name', () => {
    create();
    const el: HTMLElement = fixture.nativeElement;
    const logo = el.querySelector('.footer-logo');
    expect(logo?.querySelector('.logo-word')?.textContent).toBe('softlyx_');

    // Everything visible is aria-hidden; only the sr-only span may speak.
    const spoken = Array.from(logo?.querySelectorAll('span:not([aria-hidden="true"])') ?? []);
    expect(spoken.map(s => s.textContent)).toEqual(['Softlyx']);
  });

  it('keeps the owner\'s name and his private address out of the footer of every page', () => {
    // Decision of 2026-10-14: the business is Softlyx; the footer is on every page and
    // its text is what a search engine may quote. The Gmail address is a private account.
    create();
    const el: HTMLElement = fixture.nativeElement;
    // Text, not markup: the GitHub/LinkedIn links still carry the name in their URLs
    // (open question to the user), but nothing a reader or a snippet sees may name him.
    expect(namesOwner(el.textContent ?? '')).toBe(false);
    expect(el.innerHTML).not.toContain('gmail');
    expect(el.querySelector('.copyright')?.textContent).toBe(`© ${footer.year} Softlyx`);
    expect(el.querySelector('.brand-person')?.textContent).toBe('Web- & App-Entwicklung');

    const mailLinks = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]'));
    expect(mailLinks.length).toBeGreaterThan(0);
    for (const a of mailLinks) expect(a.getAttribute('href')).toBe(`mailto:${SITE_CONFIG.email}`);

    // The English footer has its own tagline text — the same rule applies to it.
    footer.lang.applyRoute('en', 'home');
    fixture.detectChanges();
    expect(el.querySelector('.brand-person')?.textContent).toBe('Web & App Development');
    expect(namesOwner(el.textContent ?? '')).toBe(false);
  });

  /* The flag itself, pinned in one place: emptying it is the documented lever if
     the Turkish site ever goes down, and it must stay a one-line config change. */
  it('ships with the Turkish site configured', () => {
    expect(SITE_CONFIG.turkishSiteUrl).toBe('https://softlyx.tr/');
  });

  it('shows no country switcher while the Turkish site URL is not configured', () => {
    create();
    footer.turkishSiteUrl.set('');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.site-switch')).toBeNull();
    expect(text(fixture)).not.toContain('Türkçe');
  });

  it('links to the Turkish site as a plain country switcher once configured', () => {
    create();
    footer.turkishSiteUrl.set('https://softlyx.tr/');
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.site-switch');
    expect(link?.getAttribute('href')).toBe('https://softlyx.tr/');
    expect(link?.getAttribute('hreflang')).toBe('tr');
    expect(link?.getAttribute('lang')).toBe('tr');
    expect(link?.textContent?.trim()).toBe('Türkçe');
  });

  it('shows the blog link only in German, the only locale with a blog', () => {
    create();
    const blogLink = () =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.footer-nav a'))
        .find(a => a.textContent?.trim() === 'Blog');

    expect(blogLink()).toBeDefined();

    footer.lang.applyRoute('en', 'home');
    fixture.detectChanges();
    expect(blogLink()).toBeUndefined();
  });

  it('leaves the FAB at its stylesheet position until it is dragged', () => {
    create();
    expect(footer.fabStyle()).toEqual({});
  });

  it('marks itself scrolled past 200px', () => {
    create();

    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
    footer.onScroll();
    expect(footer.scrolled()).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
    footer.onScroll();
    expect(footer.scrolled()).toBe(true);
  });

  it('drags the FAB and persists the position', () => {
    create();

    footer.onFabPointerDown(pointerEvent(936, 736));
    expect(footer.dragging()).toBe(true);

    footer.onFabPointerMove(pointerEvent(600, 400));
    expect(footer.fabStyle()).toEqual({ left: '600px', top: '400px', right: 'auto', bottom: 'auto' });

    footer.onFabPointerUp();
    expect(footer.dragging()).toBe(false);
    expect(localStorage.getItem('fab-x')).toBe('600');
    expect(localStorage.getItem('fab-y')).toBe('400');
  });

  it('clamps the FAB to the viewport', () => {
    create();

    footer.onFabPointerDown(pointerEvent(936, 736));
    footer.onFabPointerMove(pointerEvent(-500, -500));

    // innerWidth 1000 / innerHeight 800, FAB 48px, margin 16px.
    expect(footer.fabStyle()).toEqual({ left: '16px', top: '16px', right: 'auto', bottom: 'auto' });
  });

  it('ignores pointer moves and releases that did not start on the FAB', () => {
    create();

    footer.onFabPointerMove(pointerEvent(10, 10));
    footer.onFabPointerUp();

    expect(footer.fabStyle()).toEqual({});
    expect(localStorage.getItem('fab-x')).toBeNull();
  });

  it('scrolls to top on a click, but not at the end of a drag', () => {
    create();

    footer.onFabClick();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    scrollTo.mockClear();
    footer.onFabPointerDown(pointerEvent(936, 736));
    footer.onFabPointerMove(pointerEvent(600, 400));
    footer.onFabPointerUp();
    footer.onFabClick();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrollToTop always scrolls', () => {
    create();
    footer.scrollToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('restores a stored FAB position on creation, clamped to the viewport', () => {
    localStorage.setItem('fab-x', '300');
    localStorage.setItem('fab-y', '5000');
    create();

    expect(footer.fabStyle()).toEqual({ left: '300px', top: '736px', right: 'auto', bottom: 'auto' });
  });

  it('links the German-only craftsmen page in German and nowhere else', () => {
    create();
    const el: HTMLElement = fixture.nativeElement;
    const craftsmen = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('.col-links a'))
      .filter(a => a.getAttribute('href') === '/website-fuer-handwerker');
    expect(craftsmen()).toHaveLength(1);

    footer.lang.applyRoute('en', 'home');
    fixture.detectChanges();
    const services = el.querySelector('.footer-col .col-links');
    expect(services?.querySelectorAll('a')).toHaveLength(footer.lang.t().offers.items.length);
    expect(Array.from(services?.querySelectorAll('a') ?? []).some(link => link.getAttribute('href')?.includes('handwerker'))).toBe(false);
  });
});
