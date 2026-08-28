import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TerminalPanel } from './terminal-panel';
import { LangService } from '../services/lang.service';
import { ThemeService } from '../services/theme.service';

/* navigator.connection only exists in Chromium, so it is added and removed
   again rather than spied on. */
const hadConnection = 'connection' in navigator;
const realConnection = (navigator as unknown as { connection?: unknown }).connection;

function stubConnection(effectiveType: string): void {
  Object.defineProperty(navigator, 'connection', { value: { effectiveType }, configurable: true });
}

function removeConnection(): void {
  Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });
}

function restoreConnection(): void {
  if (hadConnection) {
    Object.defineProperty(navigator, 'connection', { value: realConnection, configurable: true });
  } else {
    delete (navigator as unknown as Record<string, unknown>)['connection'];
  }
}

function stubNavigationDuration(ms: number): void {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(type =>
    type === 'navigation' ? [{ duration: ms } as PerformanceNavigationTiming] : [],
  );
}

/* This environment ships no PerformanceObserver, and the component skips the
   request counter without one — so the counter is only testable with a stand-in
   that hands its callback back to the test. */
type ObserverCallback = (list: { getEntries: () => PerformanceEntryList }) => void;
let observerCallback: ObserverCallback | null = null;

function stubPerformanceObserver(): void {
  observerCallback = null;
  class FakePerformanceObserver {
    constructor(callback: ObserverCallback) { observerCallback = callback; }
    observe(): void { /* entries arrive through emitResources() */ }
    disconnect(): void { observerCallback = null; }
  }
  Object.defineProperty(globalThis, 'PerformanceObserver', { value: FakePerformanceObserver, configurable: true });
}

function removePerformanceObserver(): void {
  delete (globalThis as unknown as Record<string, unknown>)['PerformanceObserver'];
  observerCallback = null;
}

function emitResources(urls: string[]): void {
  const entries = urls.map(name => ({ name }) as PerformanceResourceTiming);
  observerCallback?.({ getEntries: () => entries });
}

/* The load handler reads the navigation timing one task later, because
   loadEventEnd is still 0 while the event is being dispatched. */
async function fireLoad(): Promise<void> {
  window.dispatchEvent(new Event('load'));
  await new Promise(resolve => setTimeout(resolve, 0));
}

function stubLanguages(tags: string[]): void {
  Object.defineProperty(navigator, 'languages', { value: tags, configurable: true });
  Object.defineProperty(navigator, 'language', { value: tags[0], configurable: true });
}

describe('TerminalPanel', () => {
  let fixture: ComponentFixture<TerminalPanel>;
  let lang: LangService;
  const realUserAgent = navigator.userAgent;
  const realLanguages = navigator.languages;
  const realLanguage = navigator.language;

  beforeEach(() => {
    /* The theme and language lines each read a stored choice. Pinning both here
       keeps every other test's line count independent of the environment; the
       unpinned cases have their own tests below. */
    localStorage.clear();
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('lang', 'de');

    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');

    fixture = TestBed.createComponent(TerminalPanel);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    removePerformanceObserver();
    Object.defineProperty(navigator, 'userAgent', { value: realUserAgent, configurable: true });
    Object.defineProperty(navigator, 'languages', { value: realLanguages, configurable: true });
    Object.defineProperty(navigator, 'language', { value: realLanguage, configurable: true });
    restoreConnection();
    vi.restoreAllMocks();
  });

  it('renders the localized build log: title, command, every step and the deploy line', () => {
    const el: HTMLElement = fixture.nativeElement;
    const t = lang.t().hero.terminal;

    expect(el.querySelector('.bar-title')?.textContent).toBe(t.title);
    expect(el.textContent).toContain(t.cmd);
    for (const step of t.steps) {
      expect(el.textContent).toContain(step.label);
      expect(el.textContent).toContain(step.note);
    }
    expect(el.textContent).toContain(t.deploy);
    expect(el.querySelectorAll('.term-line .ok')).toHaveLength(t.steps.length);
    expect(el.querySelector('.cursor')?.textContent).toBe('_');
  });

  it('staggers the rendered lines: each waits longer than the one before, deploy last', () => {
    // Pinned: without any timing entry there is neither a load-time nor a
    // request line, so the expected count does not depend on the environment.
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);
    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const lines = Array.from(host.querySelectorAll<HTMLElement>('.term-line'));
    // visitor + ip + cmd + steps + deploy — all of them render in the browser
    expect(lines.length).toBe(lang.t().hero.terminal.steps.length + 4);

    const delays = lines.map(line => parseFloat(line.style.animationDelay));
    for (const delay of delays) expect(delay).toBeGreaterThan(0);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
    probe.destroy();
  });

  it('names the device the visitor actually browses with', () => {
    const cases: [string, string][] = [
      ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone'],
      ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 'iPad'],
      ['Mozilla/5.0 (Linux; Android 14; Pixel 8)', 'Android'],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS'],
      ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Windows'],
      ['Mozilla/5.0 (X11; Linux x86_64)', 'Linux'],
      ['SomethingEntirelyUnknown/1.0', 'Browser'],
    ];

    for (const [userAgent, expected] of cases) {
      Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
      const probe = TestBed.createComponent(TerminalPanel);
      probe.detectChanges();

      expect(probe.componentInstance.visitorInfo()).toContain(expected);
      probe.destroy();
    }
  });

  it('greets the visitor from their own browser only — device and local time, no requests', () => {
    const host: HTMLElement = fixture.nativeElement;
    const visitor = host.querySelector('.visitor-line');
    const t = lang.t().hero.terminal;

    expect(visitor?.textContent).toContain(t.visitorCmd);
    expect(visitor?.textContent).toContain(`--${t.visitorDevice}`);
    expect(visitor?.textContent).toMatch(/\d{1,2}[.:]\d{2}/);
  });

  it('adds the visitor’s own region and connection type when the browser reports one', () => {
    stubConnection('4g');
    const t = lang.t().hero.terminal;
    const region = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const line = host.querySelector('.visitor-line')?.textContent ?? '';
    expect(line).toContain(`--${t.visitorRegion} ${region}`);
    expect(line).toContain(`--${t.visitorNet} 4g`);
    probe.destroy();
  });

  it('drops the network flag entirely where navigator.connection does not exist', () => {
    removeConnection();
    const t = lang.t().hero.terminal;

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const line = (host.querySelector('.visitor-line')?.textContent ?? '').trim();
    expect(line).toContain(`--${t.visitorRegion}`);
    expect(line).not.toContain(`--${t.visitorNet}`);
    expect(line).not.toMatch(/--(\s|$)/);
    probe.destroy();
  });

  /* A clock rendered once shows the minute the page happened to load and is
     wrong for the rest of the visit — the opposite of the "live" claim in the
     terminal's title bar. */
  it('keeps the clock running instead of freezing at first render', () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T10:00:00') });
    try {
      const probe = TestBed.createComponent(TerminalPanel);
      probe.detectChanges();
      const before = probe.componentInstance.visitorInfo();

      vi.advanceTimersByTime(31 * 60 * 1000);

      expect(probe.componentInstance.visitorInfo()).not.toBe(before);
      probe.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops the clock when the panel is destroyed', () => {
    vi.useFakeTimers();
    try {
      const baseline = vi.getTimerCount();
      const probe = TestBed.createComponent(TerminalPanel);
      probe.detectChanges();
      expect(vi.getTimerCount()).toBeGreaterThan(baseline);

      probe.destroy();

      expect(vi.getTimerCount()).toBe(baseline);
    } finally {
      vi.useRealTimers();
    }
  });

  it('prints the load time it actually measured on this device', async () => {
    stubNavigationDuration(340);
    const t = lang.t().hero.terminal;

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const line = host.querySelector('.load-line')?.textContent ?? '';
    expect(line).toContain(`${t.loadTime} 0.34s`);
    expect(line).toMatch(/\d+\.\d{2}s/);
    expect(line).toContain(t.loadTimeNote);
    probe.destroy();
  });

  /* The load-time line arrives late. If the delays below it were derived
     from its presence, every already-visible line would restart its reveal
     the moment the measurement lands. */
  it('does not disturb the delays of lines already on screen when it arrives', async () => {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    stubNavigationDuration(0);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const before = Array.from(host.querySelectorAll<HTMLElement>('.term-line'))
      .map(l => l.style.animationDelay);

    stubNavigationDuration(512);
    await fireLoad();
    probe.detectChanges();

    const after = Array.from(host.querySelectorAll<HTMLElement>('.term-line'))
      .map(l => l.style.animationDelay);

    expect(after).toHaveLength(before.length + 1);
    // Everything except the newly inserted line keeps its original delay.
    expect([after[0], ...after.slice(2)]).toEqual(before);

    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    probe.destroy();
  });

  /* This app runs zoneless, so the repaint has to come from the signal write
     itself. Asserting through whenStable() — with no manual detectChanges()
     after the event — is what proves the view actually updates; a spy on
     NgZone.run would pass even with the scheduler doing nothing. */
  it('repaints on its own when the measurement lands', async () => {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    stubNavigationDuration(0);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    expect(host.querySelector('.load-line')).toBeNull();

    stubNavigationDuration(512);
    await fireLoad();
    await probe.whenStable();

    expect(host.querySelector('.load-line')?.textContent).toContain('0.51s');
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    probe.destroy();
  });

  /* Inside the load handler loadEventEnd — and therefore duration — is still
     0. Reading it there dropped the line on every cold load; only a load
     from disk cache, where readyState was already 'complete', ever showed it. */
  it('reads the duration after the load event has finished, not during it', async () => {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    stubNavigationDuration(0);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();

    // The browser fills loadEventEnd only once the event has been dispatched.
    window.dispatchEvent(new Event('load'));
    stubNavigationDuration(512);
    await new Promise(resolve => setTimeout(resolve, 0));
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    expect(host.querySelector('.load-line')?.textContent).toContain('0.51s');
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    probe.destroy();
  });

  it('omits the load-time line when the browser reports no navigation timing', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([]);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    expect(probe.componentInstance.loadTimeInfo()).toBeNull();
    expect(host.querySelector('.load-line')).toBeNull();
    probe.destroy();
  });

  it('keeps the stagger strictly increasing once every measured line is there', async () => {
    stubConnection('4g');
    stubNavigationDuration(340);
    stubPerformanceObserver();

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    emitResources([`${location.origin}/main.js`]);
    probe.detectChanges();

    const host: HTMLElement = probe.nativeElement;
    const lines = Array.from(host.querySelectorAll<HTMLElement>('.term-line'));
    // visitor + load time + requests + ip + cmd + steps + deploy
    expect(lines.length).toBe(lang.t().hero.terminal.steps.length + 6);

    const delays = lines.map(line => parseFloat(line.style.animationDelay));
    for (const delay of delays) expect(delay).toBeGreaterThan(0);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
    probe.destroy();
  });

  /* The "no cookies, no tracking" promise two lines below is worth more as a
     number the visitor can verify in their own network tab. It has to be the
     real count, so a third-party request must raise it. */
  it('counts the page’s own requests and every third-party host among them', async () => {
    stubPerformanceObserver();
    stubNavigationDuration(120);
    const t = lang.t().hero.terminal;

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    emitResources([
      `${location.origin}/main.js`,
      `${location.origin}/logo.svg`,
      'https://fonts.gstatic.com/s/syne.woff2',
      'data:image/gif;base64,R0lGOD',
    ]);
    probe.detectChanges();

    const line = (probe.nativeElement as HTMLElement).querySelector('.req-line')?.textContent ?? '';
    // 4 resources + the navigation entry itself
    expect(line).toContain(`${t.requests} 5`);
    // Only the gstatic host is foreign; a data: URL has no host at all.
    expect(line).toContain(`1 ${t.requestsForeign}`);
    probe.destroy();
  });

  /* A counter read once at load would keep saying "0 third-party hosts" while
     a tracker added later fires on every visit — the one failure mode that
     would turn this line into a lie. */
  it('raises the count when a third-party request fires after the page has loaded', async () => {
    stubPerformanceObserver();
    stubNavigationDuration(120);
    const t = lang.t().hero.terminal;

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();
    emitResources([`${location.origin}/main.js`]);
    probe.detectChanges();
    expect(probe.componentInstance.requestInfo()).toContain(`0 ${t.requestsForeign}`);

    emitResources(['https://analytics.example.com/track.js']);
    probe.detectChanges();

    expect(probe.componentInstance.requestInfo()).toContain(`1 ${t.requestsForeign}`);
    expect(probe.componentInstance.requestInfo()).toContain(`${t.requests} 3`);
    probe.destroy();
  });

  it('shows no request line before the browser has reported a single resource', async () => {
    stubPerformanceObserver();
    stubNavigationDuration(120);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    await probe.whenStable();

    // The navigation entry alone is not a measurement worth printing.
    expect(probe.componentInstance.requestInfo()).toBeNull();
    expect((probe.nativeElement as HTMLElement).querySelector('.req-line')).toBeNull();
    probe.destroy();
  });

  it('reports the theme it read from the system, and stays silent after a manual choice', () => {
    const theme = TestBed.inject(ThemeService);
    const t = lang.t().hero.terminal;

    // beforeEach stored a choice, so nothing was detected.
    expect(fixture.componentInstance.themeInfo()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.theme-line')).toBeNull();

    theme.followedSystem.set(true);
    theme.isDark.set(false);
    fixture.detectChanges();

    const line = (fixture.nativeElement as HTMLElement).querySelector('.theme-line')?.textContent ?? '';
    expect(line).toContain(t.themeDetected);
    expect(line).toContain(t.themeLight);
    expect(line).toContain(t.themeApplied);
  });

  it('offers the visitor their browser language when the page is in another one', () => {
    localStorage.removeItem('lang');
    stubLanguages(['tr-TR', 'de-DE']);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    expect(probe.componentInstance.langOffer()).toBe('tr');
    const button = (probe.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.lang-line .term-action');
    expect(button?.textContent?.trim()).toBe(lang.t().hero.terminal.langSwitch);
    probe.destroy();
  });

  it('does not offer a switch to the language the visitor is already reading', () => {
    localStorage.removeItem('lang');
    stubLanguages(['de-DE']);

    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    expect(probe.componentInstance.langOffer()).toBeNull();
    expect((probe.nativeElement as HTMLElement).querySelector('.lang-line')).toBeNull();
    probe.destroy();
  });

  it('never asks again once the visitor has picked a language', () => {
    stubLanguages(['en-GB']);
    // beforeEach stored 'lang'.
    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();

    expect(probe.componentInstance.langOffer()).toBeNull();
    probe.destroy();
  });

  /* This computed runs while the hero renders, and storage access throws
     outright in browsers configured to block site data. */
  it('still renders where localStorage is not allowed', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    stubLanguages(['de-DE']);

    const probe = TestBed.createComponent(TerminalPanel);
    expect(() => probe.detectChanges()).not.toThrow();
    expect(probe.componentInstance.langOffer()).toBeNull();
    probe.destroy();
  });
  it('switches language with the rest of the page', () => {
    lang.applyRoute('en', 'home');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.bar-title')?.textContent).toBe(lang.t().hero.terminal.title);
    expect(el.textContent).toContain('GDPR-compliant');
  });
});

describe('TerminalPanel on the server', () => {
  it('renders none of the visitor lines — they exist only in the visitor’s browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    TestBed.inject(LangService).applyRoute('de', 'home');

    const ssr = TestBed.createComponent(TerminalPanel);
    ssr.detectChanges();

    const el: HTMLElement = ssr.nativeElement;
    expect(ssr.componentInstance.visitorInfo()).toBeNull();
    expect(ssr.componentInstance.loadTimeInfo()).toBeNull();
    expect(ssr.componentInstance.langOffer()).toBeNull();
    expect(ssr.componentInstance.ipVisible()).toBe(false);
    expect(el.querySelector('.visitor-line')).toBeNull();
    expect(el.querySelector('.load-line')).toBeNull();
    expect(el.querySelector('.ip-line')).toBeNull();
    expect(ssr.componentInstance.cmdDelay()).toBe('0.3s');
    expect(ssr.componentInstance.stepDelay(0)).toBe('0.9s');
  });
});
