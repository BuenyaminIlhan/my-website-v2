import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TerminalPanel } from './terminal-panel';
import { LangService } from '../services/lang.service';
import { ThemeService } from '../services/theme.service';

function stubLanguages(tags: string[]): void {
  Object.defineProperty(navigator, 'languages', { value: tags, configurable: true });
  Object.defineProperty(navigator, 'language', { value: tags[0], configurable: true });
}

/* The language-offer line: which browser language earns a switch offer and
   which does not. Split from terminal-panel.spec.ts only because the suite
   outgrew the 400-line lint budget. */
describe('TerminalPanel — the language offer', () => {
  let lang: LangService;
  const realLanguages = navigator.languages;
  const realLanguage = navigator.language;

  const mount = (): ComponentFixture<TerminalPanel> => {
    const probe = TestBed.createComponent(TerminalPanel);
    probe.detectChanges();
    return probe;
  };

  beforeEach(() => {
    localStorage.clear();
    // A stored theme keeps the theme line out of the way; 'lang' is set per test.
    localStorage.setItem('theme', 'dark');

    TestBed.configureTestingModule({});
    lang = TestBed.inject(LangService);
    lang.applyRoute('de', 'home');
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'languages', { value: realLanguages, configurable: true });
    Object.defineProperty(navigator, 'language', { value: realLanguage, configurable: true });
    vi.restoreAllMocks();
  });

  it('offers the visitor their browser language when the page is in another one', () => {
    stubLanguages(['en-US', 'de-DE']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBe('en');
    const button = (probe.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.lang-line .term-action');
    expect(button?.textContent?.trim()).toBe(lang.t().hero.terminal.langSwitch);
    probe.destroy();
  });

  it('skips Turkish — not a locale of this site — and offers the next supported language', () => {
    stubLanguages(['tr-TR', 'en-US']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBe('en');
    probe.destroy();
  });

  it('offers nothing to a Turkish-only browser instead of a language this site does not serve', () => {
    stubLanguages(['tr-TR']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBeNull();
    expect((probe.nativeElement as HTMLElement).querySelector('.lang-line')).toBeNull();
    probe.destroy();
  });

  it('treats a stale stored "tr" like any other stored choice: no offer', () => {
    localStorage.setItem('lang', 'tr');
    stubLanguages(['en-US']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBeNull();
    probe.destroy();
  });

  it('does not offer a switch to the language the visitor is already reading', () => {
    stubLanguages(['de-DE']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBeNull();
    expect((probe.nativeElement as HTMLElement).querySelector('.lang-line')).toBeNull();
    probe.destroy();
  });

  it('never asks again once the visitor has picked a language', () => {
    localStorage.setItem('lang', 'de');
    stubLanguages(['en-GB']);

    const probe = mount();

    expect(probe.componentInstance.langOffer()).toBeNull();
    probe.destroy();
  });

  /* This computed runs while the hero renders, and storage access throws
     outright in browsers configured to block site data. */
  it('still renders where localStorage is not allowed', () => {
    // The theme service reads storage in its constructor and is, in the app,
    // long constructed by the time the hero renders — mirror that order here.
    TestBed.inject(ThemeService);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    stubLanguages(['de-DE']);

    const probe = TestBed.createComponent(TerminalPanel);
    expect(() => probe.detectChanges()).not.toThrow();
    expect(probe.componentInstance.langOffer()).toBeNull();
    probe.destroy();
  });

  it('names the two languages this site serves', () => {
    const probe = mount();

    expect(probe.componentInstance.langName('de')).toBe('deutsch');
    expect(probe.componentInstance.langName('en')).toBe('english');
    probe.destroy();
  });
});
