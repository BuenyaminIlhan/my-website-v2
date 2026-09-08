import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';
import { text } from '../../testing/fixture';

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
    expect(spoken.map(s => s.textContent)).toEqual(['Softlyx – Bünyamin Ilhan']);
  });

  it('shows no country switcher while the Turkish site URL is not configured', () => {
    create();
    expect(footer.turkishSiteUrl()).toBe('');
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
});
