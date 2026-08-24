import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { LangService } from '../services/lang.service';
import { Lang } from './translations';
import { PageKey } from './route-map';

/**
 * Sets the active language from the route's data before the page component is
 * constructed — on the server (prerender) and in the browser alike, so every
 * prerendered locale tree ships with the right language. The URL always wins
 * over any stored preference.
 */
export const langGuard: CanActivateFn = route => {
  const lang = inject(LangService);
  lang.applyRoute(
    route.data['lang'] as Lang,
    route.data['pageKey'] as PageKey,
    route.data['articleId'] as string | undefined,
  );
  return true;
};
