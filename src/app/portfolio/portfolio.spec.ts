import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(Portfolio);
    portfolio = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    io.restore();
    document.body.classList.remove('light');
  });

  it('shows exactly the three web-app projects', () => {
    expect(portfolio.projects.map(p => p.title)).toEqual(['HausVio', 'Zephir', 'Dachplaner']);
  });

  it('describes a project in the current locale', () => {
    const project = portfolio.projects[0];
    expect(portfolio.description(project)).toBe(project.descriptions.de);

    lang.applyRoute('tr', 'home');
    expect(portfolio.description(project)).toBe(project.descriptions.tr);
  });

  it('renders link buttons only where a real URL exists — never a dead anchor', () => {
    const el: HTMLElement = fixture.nativeElement;
    const stages = Array.from(el.querySelectorAll('article.project'));

    expect(stages[0].querySelector('.link-btn')?.getAttribute('href')).toBe('https://hausvio.de/');
    // Dachplaner has no public URL yet.
    expect(stages[2].querySelectorAll('.link-btn')).toHaveLength(0);
    expect(el.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });

  it('renders one stage per project, each led by the laptop screen', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('article.project')).toHaveLength(3);
    expect(el.querySelectorAll('.devices .laptop')).toHaveLength(3);
  });

  it('adds tablet and phone frames only where a responsive capture exists', () => {
    const el: HTMLElement = fixture.nativeElement;
    const withPhone = portfolio.projects.filter(p => p.phoneImage);

    // HausVio and Zephir have in-app captures for all three screens.
    expect(withPhone.length).toBe(2);
    expect(el.querySelectorAll('.devices .phone')).toHaveLength(withPhone.length);
    expect(el.querySelectorAll('.devices .tablet')).toHaveLength(withPhone.length);
    const stages = Array.from(el.querySelectorAll('.devices'));
    expect(stages[1].querySelectorAll('.device')).toHaveLength(3);
    // Dachplaner shows the laptop alone — no public URL to capture from.
    expect(stages[2].querySelectorAll('.device')).toHaveLength(1);
  });

  /* Both captures ship in the markup; CSS picks one. That is what makes the
     prerendered HTML correct in either theme — a src chosen in TypeScript is
     only right after hydration. Counted per frame, so a half-wired project
     cannot pass. */
  it('ships both captures where the app has a dark mode, one where it has not', () => {
    const el: HTMLElement = fixture.nativeElement;
    const stages = Array.from(el.querySelectorAll('.devices'));

    for (const device of ['laptop', 'tablet', 'phone']) {
      const screen = stages[0].querySelector(`.${device} .screen`);
      expect(screen?.querySelectorAll('img.capture-light')).toHaveLength(1);
      expect(screen?.querySelectorAll('img.capture-dark')).toHaveLength(1);
    }

    // Zephir has no dark mode: one unclassed img per frame, visible in both.
    for (const device of ['laptop', 'tablet', 'phone']) {
      const screen = stages[1].querySelector(`.${device} .screen`);
      expect(screen?.querySelectorAll('img')).toHaveLength(1);
      expect(screen?.querySelectorAll('img.capture-light, img.capture-dark')).toHaveLength(0);
    }
  });

  it('points the dark captures at the dark files', () => {
    const el: HTMLElement = fixture.nativeElement;
    const src = (cls: string) =>
      Array.from(el.querySelectorAll(`.devices .${cls}`)).map(i => i.getAttribute('src'));

    expect(src('laptop .screen img.capture-dark')).toEqual(['assets/img/HausVio-dark.webp']);
    expect(src('tablet .screen img.capture-dark')).toEqual(['assets/img/hausvio-tablet-dark.webp']);
    expect(src('phone .screen img.capture-dark')).toEqual(['assets/img/hausvio-phone-dark.webp']);
  });

  /* Asserting that both rules EXIST is not enough — it says nothing about
     which one wins. Inverting the cascade (dropping `img` from the override)
     shows the dark captures on a light page and a rule-text check still
     passes. So this reads the resolved value instead: jsdom applies the
     component stylesheet and resolves the cascade for us. */
  it('shows exactly one capture per frame, decided by body.light', () => {
    const el: HTMLElement = fixture.nativeElement;
    /* Every device, not just the laptop: the display rules are device
       agnostic today, but a device-specific override would slip past a
       laptop-only assertion. */
    const shown = (device: string) =>
      Array.from(el.querySelectorAll(`.devices .${device} .screen img`))
        .filter(img => getComputedStyle(img).display !== 'none')
        .map(img => img.getAttribute('src'));

    // No body.light: the site is dark, so HausVio shows its dark capture.
    document.body.classList.remove('light');
    expect(shown('laptop')).toEqual(['assets/img/HausVio-dark.webp', 'assets/img/Zephir.webp', 'assets/img/Dachplaner.webp']);
    expect(shown('tablet')).toEqual(['assets/img/hausvio-tablet-dark.webp', 'assets/img/zephir-tablet.webp']);
    expect(shown('phone')).toEqual(['assets/img/hausvio-phone-dark.webp', 'assets/img/zephir-phone.webp']);

    document.body.classList.add('light');
    expect(shown('laptop')).toEqual(['assets/img/HausVio.webp', 'assets/img/Zephir.webp', 'assets/img/Dachplaner.webp']);
    expect(shown('tablet')).toEqual(['assets/img/hausvio-tablet.webp', 'assets/img/zephir-tablet.webp']);
    expect(shown('phone')).toEqual(['assets/img/hausvio-phone.webp', 'assets/img/zephir-phone.webp']);
  });

  /* A dark capture whose light counterpart is missing renders no frame at
     all, silently — the `@if` keys off the light field. */
  it('never carries a dark capture without its light counterpart', () => {
    for (const project of portfolio.projects) {
      if (project.tabletImageDark) expect(project.tabletImage).toBeDefined();
      if (project.phoneImageDark) expect(project.phoneImage).toBeDefined();
    }
  });

  /* The mirrored stage broke twice: `order` cannot move an explicitly
     placed grid item, and a media query adds no specificity. Both rules
     are pinned here because the browser is not available to the suite. */
  it('lets the stacked layout override the mirrored two-column placement', () => {
    const sheet = Array.from(document.styleSheets)
      .flatMap(s => { try { return Array.from(s.cssRules); } catch { return []; } });

    const stacking = sheet.find(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText.includes('1200px'),
    );
    expect(stacking).toBeDefined();

    const stackedSelectors = Array.from(stacking?.cssRules ?? [])
      .filter((r): r is CSSStyleRule => r instanceof CSSStyleRule)
      .map(r => r.selectorText);

    // Must name .flipped explicitly — `.project` alone loses on specificity.
    expect(stackedSelectors.some(sel => sel.includes('.flipped'))).toBe(true);
  });

  /* The claim rides on the phone capture: a project only says "same app
     everywhere" where an in-app phone screenshot backs it up. */
  it('claims "same app on every device" only where a phone capture exists', () => {
    const el: HTMLElement = fixture.nativeElement;
    const withPhone = portfolio.projects.filter(p => p.phoneImage);

    expect(el.querySelectorAll('.responsive-note')).toHaveLength(withPhone.length);
    for (const project of withPhone) {
      expect(project.tabletImage).toBeDefined();
    }
  });
});
