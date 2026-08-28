import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';

/* This test environment ships no window.matchMedia at all — which is also
   what the service's own `typeof matchMedia === 'function'` guard is for.
   Defining it here is the only way to exercise either preference. */
function stubSystemPrefersDark(dark: boolean): void {
  const matchMedia = (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? dark : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true });
}

function removeMatchMedia(): void {
  delete (window as unknown as Record<string, unknown>)['matchMedia'];
}

describe('ThemeService', () => {
  let document: Document;

  const create = () => {
    TestBed.configureTestingModule({});
    document = TestBed.inject(DOCUMENT);
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    localStorage.clear();
    removeMatchMedia();
    document?.body.classList.remove('light');
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  /* Without matchMedia nothing was detected, so nothing may be claimed. */
  it('falls back to light and claims no detection where the query is missing', () => {
    removeMatchMedia();

    const theme = create();

    expect(theme.isDark()).toBe(false);
    expect(theme.followedSystem()).toBe(false);
  });

  /* A visitor whose system is set to dark used to land on a bright page
     regardless — the site now asks before deciding for them. */
  it('follows a dark system preference when nothing was stored', () => {
    stubSystemPrefersDark(true);

    const theme = create();

    expect(theme.isDark()).toBe(true);
    expect(theme.followedSystem()).toBe(true);
    expect(document.body.classList.contains('light')).toBe(false);
  });

  it('follows a light system preference just as deliberately', () => {
    stubSystemPrefersDark(false);

    const theme = create();

    expect(theme.isDark()).toBe(false);
    expect(theme.followedSystem()).toBe(true);
    expect(document.body.classList.contains('light')).toBe(true);
  });

  it('lets a stored choice win over the system preference', () => {
    stubSystemPrefersDark(true);
    localStorage.setItem('theme', 'light');

    const theme = create();

    expect(theme.isDark()).toBe(false);
    expect(theme.followedSystem()).toBe(false);
    expect(document.body.classList.contains('light')).toBe(true);
  });

  it('restores a stored dark preference', () => {
    localStorage.setItem('theme', 'dark');

    const theme = create();

    expect(theme.isDark()).toBe(true);
    expect(theme.followedSystem()).toBe(false);
    expect(document.body.classList.contains('light')).toBe(false);
  });

  it('toggle flips the mode, the body class and the stored preference', () => {
    const theme = create();

    theme.toggle();
    expect(theme.isDark()).toBe(true);
    expect(document.body.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('dark');

    theme.toggle();
    expect(theme.isDark()).toBe(false);
    expect(document.body.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  /* After a manual toggle the terminal's "theme detected — applied" line
     would be a false claim. */
  it('stops claiming to follow the system once the visitor toggles', () => {
    stubSystemPrefersDark(true);

    const theme = create();
    expect(theme.followedSystem()).toBe(true);

    theme.toggle();
    expect(theme.followedSystem()).toBe(false);
  });
});
