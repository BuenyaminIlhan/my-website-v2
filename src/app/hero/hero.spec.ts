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

    lang.applyRoute('tr', 'home');
    fixture.detectChanges();
    expect(hero.displayed()).toBe('');

    const turkish = lang.t().hero.sub;
    vi.advanceTimersByTime(22 * (turkish.length + 1));
    expect(hero.displayed()).toBe(turkish);
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
});
