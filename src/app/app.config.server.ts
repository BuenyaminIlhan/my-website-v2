import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideServerRendering } from '@angular/platform-server';
import { WA_WINDOW } from '@ng-web-apis/common';
import { appConfig } from './app.config';

const mockMatchMedia = (): MediaQueryList => {
  const listeners = new Map<string, EventListenerOrEventListenerObject[]>();
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(listener);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const list = listeners.get(type);
      if (list) listeners.set(type, list.filter(l => l !== listener));
    },
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
};

const BROWSER_API_STUBS: Record<string, unknown> = {
  matchMedia: mockMatchMedia,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(cb, 16),
  cancelAnimationFrame: clearTimeout,
  getComputedStyle: () => ({} as CSSStyleDeclaration),
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: WA_WINDOW,
      useFactory: (doc: Document) => {
        const win = doc.defaultView ?? {};
        return new Proxy(win as Window & typeof globalThis, {
          get: (target, key: string) =>
            key in BROWSER_API_STUBS && !Reflect.get(target, key)
              ? BROWSER_API_STUBS[key]
              : Reflect.get(target, key),
        });
      },
      deps: [DOCUMENT],
    },
  ],
};

export const AppServerConfig = mergeApplicationConfig(appConfig, serverConfig);
