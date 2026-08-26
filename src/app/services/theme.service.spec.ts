import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService } from './theme.service';

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
    document.body.classList.remove('light');
    TestBed.resetTestingModule();
  });

  it('starts in light mode when nothing was stored', () => {
    const theme = create();

    expect(theme.isDark()).toBe(false);
    expect(document.body.classList.contains('light')).toBe(true);
  });

  it('restores a stored dark preference', () => {
    localStorage.setItem('theme', 'dark');

    const theme = create();

    expect(theme.isDark()).toBe(true);
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
});
