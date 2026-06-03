import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppServerConfig } from './app/app.config.server';
import { App } from './app/app';

// Polyfill browser APIs not available in Node.js (needed for Taiga UI SSR compatibility)
const g = globalThis as Record<string, unknown>;
if (!g['matchMedia']) {
  g['matchMedia'] = () => ({
    matches: false, media: '', onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
if (!g['requestAnimationFrame']) {
  g['requestAnimationFrame'] = (cb: FrameRequestCallback) => setTimeout(cb, 16);
}
if (!g['cancelAnimationFrame']) {
  g['cancelAnimationFrame'] = clearTimeout;
}

const bootstrap = (context?: BootstrapContext) =>
  bootstrapApplication(App, AppServerConfig, context);
export default bootstrap;
