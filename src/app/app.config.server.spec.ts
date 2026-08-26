import { describe, it, expect } from 'vitest';
import { WA_WINDOW } from '@ng-web-apis/common';
import { AppServerConfig } from './app.config.server';

interface WindowFactoryProvider {
  provide: unknown;
  useFactory: (doc: Document) => Window & typeof globalThis;
}

const isWindowProvider = (p: unknown): p is WindowFactoryProvider =>
  typeof p === 'object' && p !== null && 'provide' in p && p.provide === WA_WINDOW;

/** The WA_WINDOW factory the server config installs, resolved the way Angular would. */
const serverWindow = (defaultView: unknown): Window & typeof globalThis => {
  const provider = (AppServerConfig.providers as unknown[]).flat(10).find(isWindowProvider);
  if (!provider) throw new Error('server config no longer provides WA_WINDOW');
  return provider.useFactory({ defaultView } as Document);
};

/**
 * During prerendering there is no browser. The server config hands components a
 * Proxy that fills the browser APIs they touch, so a missing stub shows up here
 * rather than as a failed `ng build` at deploy time.
 */
describe('AppServerConfig', () => {
  it('stubs the browser APIs that are missing on the server', () => {
    const win = serverWindow({});

    expect(typeof win.matchMedia).toBe('function');
    expect(typeof win.requestAnimationFrame).toBe('function');
    expect(typeof win.cancelAnimationFrame).toBe('function');
    expect(typeof win.getComputedStyle).toBe('function');
    expect(typeof win.ResizeObserver).toBe('function');
    expect(typeof win.IntersectionObserver).toBe('function');
    expect(typeof win.MutationObserver).toBe('function');
  });

  it('lets the real window win wherever it has the API', () => {
    const realMatchMedia = () => undefined;
    const win = serverWindow({ matchMedia: realMatchMedia, name: 'ssr' });

    expect(win.matchMedia).toBe(realMatchMedia);
    expect(win.name).toBe('ssr');
  });

  it('survives a document without a defaultView', () => {
    const win = serverWindow(undefined);

    expect(typeof win.requestAnimationFrame).toBe('function');
  });

  it('returns a media query that never matches and accepts listeners', () => {
    const mql = serverWindow({}).matchMedia('(prefers-color-scheme: dark)');
    const listener = () => undefined;

    expect(mql.matches).toBe(false);
    expect(() => {
      mql.addEventListener('change', listener);
      mql.removeEventListener('change', listener);
      mql.addListener(listener);
      mql.removeListener(listener);
    }).not.toThrow();
    expect(mql.dispatchEvent(new Event('change'))).toBe(false);
  });

  it('provides observers that can be constructed and torn down', () => {
    const win = serverWindow({});

    const resize = new win.ResizeObserver(() => undefined);
    const mutation = new win.MutationObserver(() => undefined);

    expect(() => {
      resize.disconnect();
      mutation.disconnect();
    }).not.toThrow();
    expect(mutation.takeRecords()).toEqual([]);
  });
});
