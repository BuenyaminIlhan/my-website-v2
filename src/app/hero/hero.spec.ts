import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Hero } from './hero';
import { LangService } from '../services/lang.service';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let hero: Hero;
  let lang: LangService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Hero);
    hero = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('types out the localized subline character by character', () => {
    const text = lang.t().hero.sub;
    expect(hero.displayed()).toBe('');

    vi.advanceTimersByTime(22 * 3);
    expect(hero.displayed()).toBe(text.slice(0, 3));

    vi.advanceTimersByTime(22 * text.length);
    expect(hero.displayed()).toBe(text);
  });

  it('restarts typing when the language changes', () => {
    vi.advanceTimersByTime(22 * 5);
    expect(hero.displayed().length).toBeGreaterThan(0);

    lang.applyRoute('en', 'home');
    fixture.detectChanges();
    expect(hero.displayed()).toBe('');

    const english = lang.t().hero.sub;
    vi.advanceTimersByTime(22 * (english.length + 1));
    expect(hero.displayed()).toBe(english);
  });

  it('blinks the cursor', () => {
    expect(hero.cursorVisible()).toBe(true);

    vi.advanceTimersByTime(530);
    expect(hero.cursorVisible()).toBe(false);

    vi.advanceTimersByTime(530);
    expect(hero.cursorVisible()).toBe(true);
  });

  it('stops both timers on destroy', () => {
    vi.advanceTimersByTime(22);
    fixture.destroy();

    const typed = hero.displayed();
    const cursor = hero.cursorVisible();
    vi.advanceTimersByTime(5000);

    expect(hero.displayed()).toBe(typed);
    expect(hero.cursorVisible()).toBe(cursor);
  });

  it('renders the two masked headline lines with the accent on line two', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.hero-title .line-mask')).toHaveLength(2);
    expect(el.querySelector('.hero-title .line-1 .line')?.textContent).toBe(lang.t().hero.title1);
    expect(el.querySelector('.hero-title .accent')?.textContent).toBe(lang.t().hero.title2);
  });

  it('offers WhatsApp as its own call to action beside the primary button', () => {
    const el: HTMLElement = fixture.nativeElement;
    const wa = el.querySelector('.hero-cta .btn-whatsapp');

    expect(wa?.textContent).toContain(lang.t().whatsapp.cta);
    expect(wa?.getAttribute('href')).toBe(hero.whatsapp.href());
    expect(wa?.getAttribute('rel')).toContain('noopener');
    // The orange button stays the primary path; WhatsApp sits next to it.
    expect(el.querySelector('.hero-cta .btn-primary')).not.toBeNull();
  });

  it('renders the terminal panel and the marquee band', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-terminal-panel')).not.toBeNull();
    expect(el.querySelector('app-marquee')).not.toBeNull();
  });

  /* The scroll hint is the brand mark now: three chevrons running downwards,
     in place of the dot-on-a-line it replaced. */
  it('points down with three chevrons, and still links to the next section', () => {
    const el: HTMLElement = fixture.nativeElement;
    const hint = el.querySelector('.scroll-hint');

    expect(hint?.getAttribute('href')).toBe('#about');
    expect(el.querySelectorAll('.scroll-hint .chev')).toHaveLength(3);
    expect(el.querySelector('.scroll-label')?.textContent?.trim()).toBe(lang.t().hero.scroll);

    // The shapes carry no meaning the label does not already give.
    expect(el.querySelector('.scroll-chevrons')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.scroll-track')).toBeNull();
    expect(el.querySelector('.scroll-dot')).toBeNull();
  });
});
