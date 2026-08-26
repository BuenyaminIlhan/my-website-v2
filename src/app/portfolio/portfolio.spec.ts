import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Portfolio } from './portfolio';
import { LangService } from '../services/lang.service';
import { stubIntersectionObserver } from '../../testing/browser-stubs';

describe('Portfolio', () => {
  let fixture: ComponentFixture<Portfolio>;
  let portfolio: Portfolio;
  let lang: LangService;
  let io: ReturnType<typeof stubIntersectionObserver>;

  beforeEach(() => {
    io = stubIntersectionObserver();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Portfolio);
    portfolio = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    io.restore();
  });

  it('starts on the first project', () => {
    expect(portfolio.activeIndex()).toBe(0);
    expect(portfolio.activeProject()).toBe(portfolio.projects[0]);
  });

  it('describes the active project in the current locale', () => {
    expect(portfolio.activeDescription()).toBe(portfolio.projects[0].descriptions.de);

    lang.applyRoute('tr', 'home');
    expect(portfolio.activeDescription()).toBe(portfolio.projects[0].descriptions.tr);
  });

  it('fades out before it swaps the project, and back in afterwards', () => {
    portfolio.setActive(2);

    expect(portfolio.fading()).toBe(true);
    expect(portfolio.activeIndex()).toBe(0);

    vi.advanceTimersByTime(180);

    expect(portfolio.fading()).toBe(false);
    expect(portfolio.activeIndex()).toBe(2);
    expect(portfolio.activeProject()).toBe(portfolio.projects[2]);
  });

  it('ignores a click on the project that is already shown', () => {
    portfolio.setActive(0);

    expect(portfolio.fading()).toBe(false);
    expect(portfolio.activeIndex()).toBe(0);
  });
});
