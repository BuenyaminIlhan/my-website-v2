import { Routes } from '@angular/router';
import { Lang } from './i18n/translations';
import { langGuard } from './i18n/lang.guard';
import { requiredSlug, slugFor } from './i18n/route-map';
import { articlesFor } from './blog/blog-data';

const SERVICE_KEYS = [
  'website-erstellen-lassen',
  'web-app-entwicklung',
  'website-optimierung',
  'sorglos-paket',
] as const;

/** Static pages that exist in every locale. */
function pageRoutes(lang: Lang): Routes {
  return [
    {
      path: requiredSlug('home', lang),
      data: { lang, pageKey: 'home' },
      canActivate: [langGuard],
      loadComponent: () => import('./home/home').then(m => m.Home),
    },
    {
      path: requiredSlug('legal', lang),
      data: { lang, pageKey: 'legal' },
      canActivate: [langGuard],
      loadComponent: () => import('./legal-notice/legal-notice').then(m => m.LegalNotice),
    },
    {
      path: requiredSlug('privacy', lang),
      data: { lang, pageKey: 'privacy' },
      canActivate: [langGuard],
      loadComponent: () => import('./privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
    },
    ...SERVICE_KEYS.map(key => ({
      path: requiredSlug(key, lang),
      data: { lang, pageKey: key, slug: key },
      canActivate: [langGuard],
      loadComponent: () => import('./service-page/service-page').then(m => m.ServicePage),
    })),
  ];
}

/** Blog index plus one static route per article, so prerendering picks them up (outputMode: static). */
function blogRoutes(lang: Lang): Routes {
  const blogSlug = slugFor('blog', lang);
  if (blogSlug === undefined) return [];

  return [
    {
      path: blogSlug,
      data: { lang, pageKey: 'blog' },
      canActivate: [langGuard],
      loadComponent: () => import('./blog/blog-index').then(m => m.BlogIndex),
    },
    ...articlesFor(lang).map(article => ({
      path: blogSlug + '/' + article.slugs[lang],
      data: { lang, pageKey: 'blog', articleId: article.id },
      canActivate: [langGuard],
      loadComponent: () => import('./blog/blog-article').then(m => m.BlogArticlePage),
    })),
  ];
}

/** The locale's 404 page and its catch-all — must stay last in the tree. */
function notFoundRoutes(lang: Lang): Routes {
  return [
    {
      path: requiredSlug('notFound', lang),
      data: { lang, pageKey: 'notFound' },
      canActivate: [langGuard],
      loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
    },
    {
      path: '**',
      data: { lang, pageKey: 'notFound' },
      canActivate: [langGuard],
      loadComponent: () => import('./not-found/not-found').then(m => m.NotFound),
    },
  ];
}

/**
 * One route tree per locale. Page titles/meta are set per page via SeoService
 * (they render into the prerendered HTML); slugs come from the route map so
 * each locale gets localized URLs. With outputMode: static every route here
 * is prerendered to its own index.html.
 */
function localeRoutes(lang: Lang): Routes {
  return [...pageRoutes(lang), ...blogRoutes(lang), ...notFoundRoutes(lang)];
}

export const routes: Routes = [
  { path: 'en', children: localeRoutes('en') },
  { path: 'tr', children: localeRoutes('tr') },
  // German is the unprefixed default tree; its '**' catch-all must come last.
  ...localeRoutes('de'),
];
